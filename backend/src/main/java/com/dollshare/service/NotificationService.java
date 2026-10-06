package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.entity.Notification;
import com.dollshare.mapper.NotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * 通知服务：发送通知、我的通知列表、未读数、全部已读
 * <p>
 * 未读数使用 Redis 计数（key: notif:unread:{userId}）：
 * - 发通知 INCR，全部已读 DEL 清零
 * - 读未读时 Redis 无值则用 MySQL 初始化回填
 * - Redis 不可用时自动降级回 MySQL 统计，不影响主流程
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String NOTIF_UNREAD_KEY = "notif:unread:";

    private final NotificationMapper notificationMapper;
    private final StringRedisTemplate redisTemplate;

    /**
     * 发送通知（内部调用）。自己触发自己的动作不通知
     */
    public void send(Long receiverId, String type, Long actorId, Long dynamicId) {
        if (receiverId == null || actorId == null || receiverId.equals(actorId)) {
            return;
        }
        Notification n = new Notification();
        n.setUserId(receiverId);
        n.setType(type);
        n.setActorId(actorId);
        n.setDynamicId(dynamicId);
        n.setIsRead(0);
        notificationMapper.insert(n);
        // Redis 未读数 +1（失败不影响主流程）
        try {
            redisTemplate.opsForValue().increment(NOTIF_UNREAD_KEY + receiverId);
        } catch (Exception ignored) {
        }
    }

    /**
     * 我的通知列表
     */
    public Result<List<Notification>> mine() {
        return Result.success(notificationMapper.selectMine(UserContext.getUserId()));
    }

    /**
     * 我的未读通知数：Redis 优先，无值回填，异常降级 MySQL
     */
    public Result<Map<String, Object>> unreadCount() {
        Long userId = UserContext.getUserId();
        try {
            String v = redisTemplate.opsForValue().get(NOTIF_UNREAD_KEY + userId);
            if (v != null) {
                return Result.success(java.util.Map.of("count", Long.parseLong(v)));
            }
            // Redis 无值（如刚重启）：MySQL 统计并回填
            Long count = countUnreadFromDb(userId);
            redisTemplate.opsForValue().set(NOTIF_UNREAD_KEY + userId, String.valueOf(count));
            return Result.success(java.util.Map.of("count", count));
        } catch (Exception e) {
            // Redis 不可用：直接查 MySQL
            return Result.success(java.util.Map.of("count", countUnreadFromDb(userId)));
        }
    }

    /**
     * 全部标记已读
     */
    public Result<Void> readAll() {
        Notification update = new Notification();
        update.setIsRead(1);
        notificationMapper.update(update,
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, UserContext.getUserId())
                        .eq(Notification::getIsRead, 0));
        // Redis 计数清零
        try {
            redisTemplate.delete(NOTIF_UNREAD_KEY + UserContext.getUserId());
        } catch (Exception ignored) {
        }
        return Result.success();
    }

    /**
     * 从 MySQL 统计未读通知数
     */
    private Long countUnreadFromDb(Long userId) {
        return notificationMapper.selectCount(
                new LambdaQueryWrapper<Notification>()
                        .eq(Notification::getUserId, userId)
                        .eq(Notification::getIsRead, 0));
    }
}
