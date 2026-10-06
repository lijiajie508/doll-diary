package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Notification;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 通知 Mapper
 */
public interface NotificationMapper extends BaseMapper<Notification> {

    /**
     * 我的通知列表（联表带出触发者昵称/头像）
     */
    @Select("SELECT n.*, u.nickname AS actor_nickname, u.avatar AS actor_avatar " +
            "FROM notification n " +
            "LEFT JOIN user u ON n.actor_id = u.id " +
            "WHERE n.user_id = #{userId} " +
            "ORDER BY n.created_at DESC " +
            "LIMIT 100")
    List<Notification> selectMine(@Param("userId") Long userId);
}
