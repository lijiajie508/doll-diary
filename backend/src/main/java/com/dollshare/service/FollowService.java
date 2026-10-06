package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.entity.Follow;
import com.dollshare.entity.User;
import com.dollshare.mapper.FollowMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 关注服务：关注/取关、关注列表、粉丝列表、关注数量
 */
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowMapper followMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

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
     * 关注/取消关注（切换）——仅普通用户。返回最新关注状态
     */
    public Result<Map<String, Object>> toggle(Long followedId) {
        if (isAdmin()) {
            return Result.error(403, "管理员无需关注");
        }
        Long userId = UserContext.getUserId();
        if (userId.equals(followedId)) {
            return Result.error(500, "不能关注自己");
        }

        Follow existing = followMapper.selectOne(
                new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, userId)
                        .eq(Follow::getFollowedId, followedId));

        boolean following;
        if (existing == null) {
            Follow f = new Follow();
            f.setFollowerId(userId);
            f.setFollowedId(followedId);
            followMapper.insert(f);
            following = true;
            // 通知被关注者
            notificationService.send(followedId, "follow", userId, null);
        } else {
            followMapper.deleteById(existing.getId());
            following = false;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("following", following);
        return Result.success(data);
    }

    /**
     * 我是否已关注某用户
     */
    public Result<Boolean> status(Long followedId) {
        Long userId = UserContext.getUserId();
        if (userId == null || userId.equals(followedId)) {
            return Result.success(false);
        }
        Long count = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, userId)
                        .eq(Follow::getFollowedId, followedId));
        return Result.success(count > 0);
    }

    /**
     * 我的关注数 / 粉丝数
     */
    public Result<Map<String, Object>> counts() {
        Long userId = UserContext.getUserId();
        Long followingCount = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowerId, userId));
        Long fansCount = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowedId, userId));

        Map<String, Object> data = new HashMap<>();
        data.put("followingCount", followingCount);
        data.put("fansCount", fansCount);
        return Result.success(data);
    }

    /**
     * 我关注的人列表（含昵称/头像/是否互关）
     */
    public Result<List<Map<String, Object>>> following() {
        Long userId = UserContext.getUserId();
        List<Follow> list = followMapper.selectList(
                new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowerId, userId)
                        .orderByDesc(Follow::getId));
        return Result.success(buildUserList(list, userId, true));
    }

    /**
     * 我的粉丝列表（含昵称/头像/是否已回关）
     */
    public Result<List<Map<String, Object>>> fans() {
        Long userId = UserContext.getUserId();
        List<Follow> list = followMapper.selectList(
                new LambdaQueryWrapper<Follow>()
                        .eq(Follow::getFollowedId, userId)
                        .orderByDesc(Follow::getId));
        return Result.success(buildUserList(list, userId, false));
    }

    /**
     * 组装关注/粉丝列表：对端用户信息 + 我是否已关注对方（用于显示回关/取关按钮）
     */
    private List<Map<String, Object>> buildUserList(List<Follow> list, Long meId, boolean isFollowing) {
        if (list.isEmpty()) {
            return new ArrayList<>();
        }

        // 取对端用户ID
        List<Long> targetIds = list.stream()
                .map(f -> isFollowing ? f.getFollowedId() : f.getFollowerId())
                .collect(Collectors.toList());

        // 批量查用户信息
        Map<Long, User> userMap = userMapper.selectBatchIds(targetIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        // 批量查我是否已关注这些用户
        Set<Long> myFollowingIds = new HashSet<>();
        if (!isFollowing) {
            followMapper.selectList(new LambdaQueryWrapper<Follow>()
                            .eq(Follow::getFollowerId, meId)
                            .in(Follow::getFollowedId, targetIds))
                    .forEach(f -> myFollowingIds.add(f.getFollowedId()));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Long id : targetIds) {
            User u = userMap.get(id);
            if (u == null) {
                continue;
            }
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("nickname", u.getNickname());
            m.put("avatar", u.getAvatar());
            m.put("following", isFollowing || myFollowingIds.contains(id));
            result.add(m);
        }
        return result;
    }
}
