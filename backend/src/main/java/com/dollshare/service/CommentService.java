package com.dollshare.service;

import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.CommentDTO;
import com.dollshare.entity.Comment;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.User;
import com.dollshare.mapper.CommentMapper;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 评论服务
 */
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final DynamicMapper dynamicMapper;
    private final NotificationService notificationService;
    private final OpLogService opLogService;

    /**
     * 当前登录用户是否为管理员
     */
    private boolean isAdmin() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return false;
        }
        User me = userMapper.selectById(userId);
        return me != null && me.getRole() == 2;
    }

    /**
     * 某条动态下的评论列表
     */
    public Result<List<Comment>> listByDynamic(Long dynamicId) {
        return Result.success(commentMapper.selectByDynamicId(dynamicId));
    }

    /**
     * 我的评论列表——仅普通用户
     */
    public Result<List<Comment>> mine() {
        if (isAdmin()) {
            throw new BusinessException(403, "管理员无个人评论记录");
        }
        return Result.success(commentMapper.selectMine(UserContext.getUserId()));
    }

    /**
     * 发表评论——仅普通用户
     */
    public Result<Void> add(CommentDTO dto) {
        if (isAdmin()) {
            throw new BusinessException(403, "管理员无需发表评论");
        }
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new BusinessException("评论内容不能为空");
        }
        Comment c = new Comment();
        c.setDynamicId(dto.getDynamicId());
        c.setUserId(UserContext.getUserId());
        c.setContent(dto.getContent());
        commentMapper.insert(c);
        // 通知动态作者（评论自己的动态不通知）
        Dynamic d = dynamicMapper.selectById(dto.getDynamicId());
        if (d != null) {
            notificationService.send(d.getUserId(), "comment", c.getUserId(), dto.getDynamicId());
        }
        return Result.success();
    }

    /**
     * 删除评论：作者本人或管理员（管理员负责内容治理，删除留痕）
     */
    public Result<Void> delete(Long id, HttpServletRequest request) {
        Comment c = commentMapper.selectById(id);
        if (c == null) {
            throw new BusinessException("评论不存在");
        }
        Long userId = UserContext.getUserId();
        boolean isAdminNow = isAdmin();
        if (!c.getUserId().equals(userId) && !isAdminNow) {
            throw new BusinessException(403, "无权删除该评论");
        }
        // 管理员删除他人的评论 → 记录操作日志
        if (isAdminNow && !c.getUserId().equals(userId)) {
            opLogService.record("delete_comment", "comment", id,
                    "删除评论 #" + id + "（作者 uid=" + c.getUserId() + "）",
                    opLogService.getIp(request), "成功");
        }
        commentMapper.deleteById(id);
        return Result.success();
    }
}
