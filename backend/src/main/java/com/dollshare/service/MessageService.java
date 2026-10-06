package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.MessageDTO;
import com.dollshare.entity.Message;
import com.dollshare.entity.User;
import com.dollshare.mapper.MessageMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 私信服务：会话列表、聊天记录、发送、标记已读、未读总数
 * <p>
 * 未读数使用 Redis Hash 计数（key: msg:unread:{userId}，field=对方userId）：
 * - 发送消息 HINCRBY，标记已读 HDEL 清零
 * - 读未读时 Redis 无值则用 MySQL 初始化回填
 * - Redis 不可用时自动降级回 MySQL，不影响主流程
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    private static final String MSG_UNREAD_KEY = "msg:unread:";

    private final MessageMapper messageMapper;
    private final UserMapper userMapper;
    private final StringRedisTemplate redisTemplate;

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
     * 会话列表：每个会话 = 对方信息 + 最后一条消息 + 时间 + 未读数
     * 未读数优先读 Redis，Redis 不可用时用消息列表统计
     */
    public Result<List<Map<String, Object>>> conversations() {
        Long meId = UserContext.getUserId();
        List<Message> all = messageMapper.selectConversations(meId);

        // 尝试从 Redis 读取各会话未读数
        Map<Object, Object> redisUnread = new HashMap<>();
        boolean useRedis = true;
        try {
            redisUnread = redisTemplate.opsForHash().entries(MSG_UNREAD_KEY + meId);
        } catch (Exception e) {
            useRedis = false;
        }

        // 按对方分组（保持最后消息时间倒序），第一个出现的即为该会话最后一条
        Map<Long, Map<String, Object>> groups = new LinkedHashMap<>();
        for (Message m : all) {
            Long otherId = m.getOtherId();
            if (!groups.containsKey(otherId)) {
                Map<String, Object> g = new HashMap<>();
                g.put("otherId", otherId);
                g.put("nickname", m.getOtherNickname());
                g.put("avatar", m.getOtherAvatar());
                g.put("lastMessage", m.getContent());
                g.put("lastTime", m.getCreatedAt());
                if (useRedis) {
                    Object u = redisUnread.get(String.valueOf(otherId));
                    g.put("unread", u == null ? 0 : Integer.parseInt(u.toString()));
                } else {
                    g.put("unread", 0);
                }
                groups.put(otherId, g);
            }
            // Redis 不可用时：统计对方发给我的未读
            if (!useRedis && m.getReceiverId().equals(meId) && m.getIsRead() != null && m.getIsRead() == 0) {
                Map<String, Object> g = groups.get(otherId);
                g.put("unread", ((Number) g.get("unread")).intValue() + 1);
            }
        }
        return Result.success(new ArrayList<>(groups.values()));
    }

    /**
     * 与某人的聊天记录（正序）
     */
    public Result<List<Message>> thread(Long otherId) {
        Long meId = UserContext.getUserId();
        return Result.success(messageMapper.selectThread(meId, otherId));
    }

    /**
     * 发送私信——仅普通用户
     */
    public Result<Void> send(MessageDTO dto) {
        if (isAdmin()) {
            return Result.error(403, "管理员无需私信");
        }
        if (dto.getReceiverId() == null || dto.getContent() == null || dto.getContent().isBlank()) {
            return Result.error(500, "消息内容不能为空");
        }
        Long meId = UserContext.getUserId();
        if (meId.equals(dto.getReceiverId())) {
            return Result.error(500, "不能给自己发消息");
        }
        User target = userMapper.selectById(dto.getReceiverId());
        if (target == null) {
            return Result.error(500, "用户不存在");
        }
        Message m = new Message();
        m.setSenderId(meId);
        m.setReceiverId(dto.getReceiverId());
        m.setContent(dto.getContent().trim());
        m.setIsRead(0);
        messageMapper.insert(m);
        // 接收者未读数 +1（失败不影响主流程）
        try {
            redisTemplate.opsForHash().increment(MSG_UNREAD_KEY + dto.getReceiverId(), String.valueOf(meId), 1);
        } catch (Exception ignored) {
        }
        return Result.success();
    }

    /**
     * 把某人发给我的消息全部标记已读
     */
    public Result<Void> markRead(Long otherId) {
        Long meId = UserContext.getUserId();
        Message update = new Message();
        update.setIsRead(1);
        messageMapper.update(update,
                new LambdaQueryWrapper<Message>()
                        .eq(Message::getSenderId, otherId)
                        .eq(Message::getReceiverId, meId)
                        .eq(Message::getIsRead, 0));
        // 该会话未读清零
        try {
            redisTemplate.opsForHash().delete(MSG_UNREAD_KEY + meId, String.valueOf(otherId));
        } catch (Exception ignored) {
        }
        return Result.success();
    }

    /**
     * 我的未读私信总数（导航栏红点用）：Redis 优先，无值回填，异常降级 MySQL
     */
    public Result<Map<String, Object>> unreadTotal() {
        Long meId = UserContext.getUserId();
        try {
            Map<Object, Object> m = redisTemplate.opsForHash().entries(MSG_UNREAD_KEY + meId);
            if (m.isEmpty()) {
                // Redis 无值（如刚重启）：MySQL 按发送者分组回填
                List<Message> unread = messageMapper.selectList(
                        new LambdaQueryWrapper<Message>()
                                .eq(Message::getReceiverId, meId)
                                .eq(Message::getIsRead, 0));
                long total = 0;
                Map<String, Long> bySender = new HashMap<>();
                for (Message msg : unread) {
                    String k = String.valueOf(msg.getSenderId());
                    bySender.merge(k, 1L, Long::sum);
                    total++;
                }
                bySender.forEach((k, v) ->
                        redisTemplate.opsForHash().put(MSG_UNREAD_KEY + meId, k, String.valueOf(v)));
                return Result.success(java.util.Map.of("count", total));
            }
            long total = m.values().stream().mapToLong(v -> Long.parseLong(v.toString())).sum();
            return Result.success(java.util.Map.of("count", total));
        } catch (Exception e) {
            // Redis 不可用：直接查 MySQL
            Long count = messageMapper.selectCount(
                    new LambdaQueryWrapper<Message>()
                            .eq(Message::getReceiverId, meId)
                            .eq(Message::getIsRead, 0));
            return Result.success(java.util.Map.of("count", count));
        }
    }
}
