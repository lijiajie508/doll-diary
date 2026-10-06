package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.ReportDTO;
import com.dollshare.entity.Comment;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.Report;
import com.dollshare.entity.User;
import com.dollshare.mapper.CommentMapper;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.ReportMapper;
import com.dollshare.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 举报服务：用户端举报 + 管理端列表/处理（忽略、删除内容、封禁用户），
 * 形成完整的内容治理闭环
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportMapper reportMapper;
    private final UserMapper userMapper;
    private final DynamicMapper dynamicMapper;
    private final CommentMapper commentMapper;
    private final OpLogService opLogService;

    /**
     * 用户端举报：动态 / 评论 / 用户
     */
    public Result<Void> report(ReportDTO dto) {
        Long meId = UserContext.getUserId();
        String type = dto.getType();
        Long targetId = dto.getTargetId();

        if (!List.of("dynamic", "comment", "user").contains(type)) {
            throw new BusinessException("举报类型不合法");
        }
        // 校验对象存在 + 不能举报自己
        if ("dynamic".equals(type)) {
            Dynamic d = dynamicMapper.selectById(targetId);
            if (d == null) throw new BusinessException("动态不存在");
            if (d.getUserId().equals(meId)) throw new BusinessException("不能举报自己的动态");
        } else if ("comment".equals(type)) {
            Comment c = commentMapper.selectById(targetId);
            if (c == null) throw new BusinessException("评论不存在");
            if (c.getUserId().equals(meId)) throw new BusinessException("不能举报自己的评论");
        } else {
            if (targetId.equals(meId)) throw new BusinessException("不能举报自己");
            User u = userMapper.selectById(targetId);
            if (u == null) throw new BusinessException("用户不存在");
        }

        // 同一举报人对同一对象重复举报（待处理中）直接拦截
        Long dup = reportMapper.selectCount(new LambdaQueryWrapper<Report>()
                .eq(Report::getType, type)
                .eq(Report::getTargetId, targetId)
                .eq(Report::getReporterId, meId)
                .eq(Report::getStatus, 0));
        if (dup > 0) {
            throw new BusinessException("已举报过，等待管理员处理");
        }

        Report r = new Report();
        r.setType(type);
        r.setTargetId(targetId);
        r.setReporterId(meId);
        r.setReason(dto.getReason());
        r.setStatus(0);
        reportMapper.insert(r);
        return Result.success();
    }

    /**
     * 管理端：举报列表（分页 + 状态筛选），带举报人与被举报对象摘要
     */
    public Result<Map<String, Object>> list(int page, int size, Integer status) {
        if (!isAdmin()) throw new BusinessException(403, "无管理员权限");
        if (page < 1) page = 1;
        if (size < 1 || size > 50) size = 10;

        Page<Report> p = reportMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<Report>()
                        .eq(status != null, Report::getStatus, status)
                        .orderByDesc(Report::getCreatedAt));

        List<Map<String, Object>> list = new ArrayList<>();
        for (Report r : p.getRecords()) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("type", r.getType());
            m.put("targetId", r.getTargetId());
            m.put("reason", r.getReason());
            m.put("status", r.getStatus());
            m.put("createdAt", r.getCreatedAt());
            m.put("handledAt", r.getHandledAt());
            User reporter = userMapper.selectById(r.getReporterId());
            m.put("reporterName", reporter != null ? reporter.getNickname() : "用户" + r.getReporterId());
            m.put("targetSummary", targetSummary(r));
            list.add(m);
        }

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", p.getTotal());
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }

    /**
     * 管理端：处理举报
     * action: ignore 忽略 / delete 删除内容 / ban 封禁用户并删除内容
     */
    public Result<Void> handle(Long id, String action, HttpServletRequest request) {
        if (!isAdmin()) throw new BusinessException(403, "无管理员权限");
        Report r = reportMapper.selectById(id);
        if (r == null) throw new BusinessException("举报不存在");
        if (r.getStatus() != 0) throw new BusinessException("该举报已处理");

        Long adminId = UserContext.getUserId();
        String detail;
        if ("ignore".equals(action)) {
            r.setStatus(2);
            detail = "忽略举报 #" + id;
        } else if ("delete".equals(action)) {
            deleteContent(r);
            r.setStatus(1);
            detail = "删除被举报内容（举报 #" + id + "）";
        } else if ("ban".equals(action)) {
            Long ownerId = ownerOf(r);
            if (ownerId != null) {
                if (ownerId.equals(adminId)) throw new BusinessException("不能封禁自己");
                User target = userMapper.selectById(ownerId);
                if (target == null) throw new BusinessException("用户不存在");
                if (target.getRole() == 2) throw new BusinessException("不能封禁管理员账号");
                target.setStatus(0);
                userMapper.updateById(target);
            }
            deleteContent(r);
            r.setStatus(1);
            detail = "封禁用户并删除内容（举报 #" + id + "）";
        } else {
            throw new BusinessException("处理方式不合法");
        }

        r.setHandledBy(adminId);
        r.setHandledAt(LocalDateTime.now());
        reportMapper.updateById(r);

        opLogService.record("handle_report", "report", id, detail, opLogService.getIp(request), "成功");
        return Result.success();
    }

    /** 被举报对象摘要（内容前 50 字 / 用户信息） */
    private String targetSummary(Report r) {
        if ("dynamic".equals(r.getType())) {
            Dynamic d = dynamicMapper.selectById(r.getTargetId());
            if (d == null) return "动态已删除";
            return trimText(d.getContent());
        } else if ("comment".equals(r.getType())) {
            Comment c = commentMapper.selectById(r.getTargetId());
            if (c == null) return "评论已删除";
            return trimText(c.getContent());
        } else {
            User u = userMapper.selectById(r.getTargetId());
            if (u == null) return "用户已注销";
            return "用户 @" + u.getNickname() + "（" + u.getUsername() + "）";
        }
    }

    /** 被举报内容的归属用户ID（用于封禁） */
    private Long ownerOf(Report r) {
        if ("dynamic".equals(r.getType())) {
            Dynamic d = dynamicMapper.selectById(r.getTargetId());
            return d != null ? d.getUserId() : null;
        } else if ("comment".equals(r.getType())) {
            Comment c = commentMapper.selectById(r.getTargetId());
            return c != null ? c.getUserId() : null;
        }
        return r.getTargetId();
    }

    /** 删除被举报内容（user 类型无需删除内容） */
    private void deleteContent(Report r) {
        if ("dynamic".equals(r.getType())) {
            dynamicMapper.deleteById(r.getTargetId());
        } else if ("comment".equals(r.getType())) {
            commentMapper.deleteById(r.getTargetId());
        }
    }

    private String trimText(String s) {
        if (s == null || s.isBlank()) return "（无文字内容）";
        return s.length() > 50 ? s.substring(0, 50) + "..." : s;
    }

    private boolean isAdmin() {
        Long userId = UserContext.getUserId();
        if (userId == null) return false;
        User me = userMapper.selectById(userId);
        return me != null && me.getRole() == 2;
    }
}
