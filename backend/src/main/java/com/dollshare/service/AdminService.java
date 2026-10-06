package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.OpLog;
import com.dollshare.entity.User;
import com.dollshare.mapper.CommentMapper;
import com.dollshare.mapper.DollMapper;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.FavoriteMapper;
import com.dollshare.mapper.OpLogMapper;
import com.dollshare.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员服务：数据看板、用户管理（封禁/解封）、操作日志
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserMapper userMapper;
    private final DynamicMapper dynamicMapper;
    private final DollMapper dollMapper;
    private final CommentMapper commentMapper;
    private final FavoriteMapper favoriteMapper;
    private final OpLogMapper opLogMapper;
    private final OpLogService opLogService;

    /**
     * 校验当前登录用户是否为管理员
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
     * 数据看板：总览统计 + 热门动态 + 活跃用户
     */
    public Result<Map<String, Object>> stats() {
        if (!isAdmin()) {
            return Result.error(403, "无管理员权限");
        }
        // 今日 0 点
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

        Map<String, Object> data = new HashMap<>();
        data.put("userCount", userMapper.selectCount(null));
        data.put("dynamicCount", dynamicMapper.selectCount(null));
        data.put("dollCount", dollMapper.selectCount(null));
        data.put("commentCount", commentMapper.selectCount(null));
        data.put("favoriteCount", favoriteMapper.selectCount(null));
        data.put("todayUserCount", userMapper.selectCount(
                new LambdaQueryWrapper<User>().ge(User::getCreatedAt, todayStart)));
        data.put("todayDynamicCount", dynamicMapper.selectCount(
                new LambdaQueryWrapper<Dynamic>().ge(Dynamic::getCreatedAt, todayStart)));
        data.put("hotDynamics", dynamicMapper.selectHotDynamics(5));
        data.put("activeUsers", userMapper.selectActiveUsers(5));

        // 近 7 天注册/动态趋势（看板柱状图）
        LocalDateTime weekStart = LocalDate.now().minusDays(6).atStartOfDay();
        data.put("userTrend", userMapper.selectRegisterTrend(weekStart));
        data.put("dynamicTrend", dynamicMapper.selectDynamicTrend(weekStart));
        return Result.success(data);
    }

    /**
     * 用户列表：分页 + 关键词搜索（用户名/昵称），带动态数/娃娃数
     */
    public Result<Map<String, Object>> users(int page, int size, String keyword) {
        if (!isAdmin()) {
            return Result.error(403, "无管理员权限");
        }
        if (page < 1) {
            page = 1;
        }
        if (size < 1 || size > 50) {
            size = 10;
        }
        long offset = (long) (page - 1) * size;
        List<Map<String, Object>> list = userMapper.selectUserList(keyword, offset, size);
        long total = userMapper.countUsers(keyword);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }

    /**
     * 动态列表：分页 + 关键词搜索（内容/作者昵称），管理员内容巡查用
     */
    public Result<Map<String, Object>> dynamics(int page, int size, String keyword) {
        if (!isAdmin()) {
            return Result.error(403, "无管理员权限");
        }
        if (page < 1) {
            page = 1;
        }
        if (size < 1 || size > 50) {
            size = 10;
        }
        long offset = (long) (page - 1) * size;
        List<Map<String, Object>> list = dynamicMapper.selectAdminList(keyword, offset, size);
        long total = dynamicMapper.countAdminList(keyword);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }

    /**
     * 评论列表：分页 + 关键词搜索（内容/作者昵称）
     */
    public Result<Map<String, Object>> comments(int page, int size, String keyword) {
        if (!isAdmin()) {
            return Result.error(403, "无管理员权限");
        }
        if (page < 1) {
            page = 1;
        }
        if (size < 1 || size > 50) {
            size = 10;
        }
        long offset = (long) (page - 1) * size;
        List<Map<String, Object>> list = commentMapper.selectAdminList(keyword, offset, size);
        long total = commentMapper.countAdminList(keyword);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }

    /**
     * 娃娃列表：分页 + 关键词搜索（名字/拥有者昵称），管理员只读查看
     */
    public Result<Map<String, Object>> dolls(int page, int size, String keyword) {
        if (!isAdmin()) {
            return Result.error(403, "无管理员权限");
        }
        if (page < 1) {
            page = 1;
        }
        if (size < 1 || size > 50) {
            size = 10;
        }
        long offset = (long) (page - 1) * size;
        List<Map<String, Object>> list = dollMapper.selectAdminList(keyword, offset, size);
        long total = dollMapper.countAdminList(keyword);

        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }

    /**
     * 封禁 / 解封用户（记录操作日志）
     */
    public Result<Void> updateStatus(Long id, Integer status, HttpServletRequest request) {
        if (!isAdmin()) {
            throw new BusinessException(403, "无管理员权限");
        }
        if (status == null || (status != 0 && status != 1)) {
            throw new BusinessException("状态参数错误");
        }
        User me = userMapper.selectById(UserContext.getUserId());
        if (me != null && id.equals(me.getId())) {
            throw new BusinessException("不能封禁自己");
        }
        User target = userMapper.selectById(id);
        if (target == null) {
            throw new BusinessException("用户不存在");
        }
        if (target.getRole() == 2) {
            throw new BusinessException("不能操作管理员账号");
        }
        target.setStatus(status);
        userMapper.updateById(target);
        opLogService.record("ban_user", "user", id,
                (status == 0 ? "封禁用户 @" : "解封用户 @") + target.getNickname(),
                opLogService.getIp(request), "成功");
        return Result.success();
    }

    /**
     * 管理员操作日志列表（分页，倒序）
     */
    public Result<Map<String, Object>> opLogs(int page, int size) {
        if (!isAdmin()) {
            throw new BusinessException(403, "无管理员权限");
        }
        if (page < 1) page = 1;
        if (size < 1 || size > 50) size = 10;
        Page<OpLog> p = opLogMapper.selectPage(new Page<>(page, size),
                new LambdaQueryWrapper<OpLog>().orderByDesc(OpLog::getId));
        Map<String, Object> data = new HashMap<>();
        data.put("list", p.getRecords());
        data.put("total", p.getTotal());
        data.put("page", page);
        data.put("size", size);
        return Result.success(data);
    }
}
