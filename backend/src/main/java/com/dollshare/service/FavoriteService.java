package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.Favorite;
import com.dollshare.entity.User;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.FavoriteMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 点赞服务：点赞/取消点赞、我点赞过的动态
 */
@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteMapper favoriteMapper;
    private final DynamicMapper dynamicMapper;
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
     * 点赞/取消点赞（切换）——仅普通用户。返回最新点赞状态和点赞数
     */
    public Result<Map<String, Object>> toggle(Long dynamicId) {
        if (isAdmin()) {
            return Result.error(403, "管理员无需点赞");
        }
        Long userId = UserContext.getUserId();

        Favorite existing = favoriteMapper.selectOne(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getDynamicId, dynamicId)
                        .eq(Favorite::getUserId, userId));

        boolean liked;
        if (existing == null) {
            Favorite f = new Favorite();
            f.setDynamicId(dynamicId);
            f.setUserId(userId);
            favoriteMapper.insert(f);
            liked = true;
            // 通知动态作者（点赞后取作者ID，自己的动态不通知）
            Dynamic d = dynamicMapper.selectById(dynamicId);
            if (d != null) {
                notificationService.send(d.getUserId(), "like", userId, dynamicId);
            }
        } else {
            favoriteMapper.deleteById(existing.getId());
            liked = false;
        }

        Long count = favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>().eq(Favorite::getDynamicId, dynamicId));

        Map<String, Object> data = new HashMap<>();
        data.put("liked", liked);
        data.put("likeCount", count);
        return Result.success(data);
    }

    /**
     * 我点赞过的动态列表——仅普通用户
     */
    public Result<List<Dynamic>> mine() {
        if (isAdmin()) {
            return Result.error(403, "管理员无点赞记录");
        }
        return Result.success(dynamicMapper.selectLikedFeed(UserContext.getUserId()));
    }
}
