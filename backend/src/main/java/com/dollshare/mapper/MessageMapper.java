package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Message;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 私信 Mapper
 */
public interface MessageMapper extends BaseMapper<Message> {

    /**
     * 与我相关的全部消息（倒序，会话列表用），联表带出会话对方信息
     */
    @Select("SELECT m.*, " +
            "IF(m.sender_id = #{meId}, m.receiver_id, m.sender_id) AS other_id, " +
            "u.nickname AS other_nickname, u.avatar AS other_avatar " +
            "FROM message m " +
            "LEFT JOIN user u ON u.id = IF(m.sender_id = #{meId}, m.receiver_id, m.sender_id) " +
            "WHERE m.sender_id = #{meId} OR m.receiver_id = #{meId} " +
            "ORDER BY m.created_at DESC " +
            "LIMIT 1000")
    List<Message> selectConversations(@Param("meId") Long meId);

    /**
     * 我与某人的全部消息（正序，聊天窗用）
     */
    @Select("SELECT * FROM message m " +
            "WHERE (m.sender_id = #{meId} AND m.receiver_id = #{otherId}) " +
            "   OR (m.sender_id = #{otherId} AND m.receiver_id = #{meId}) " +
            "ORDER BY m.created_at ASC " +
            "LIMIT 500")
    List<Message> selectThread(@Param("meId") Long meId, @Param("otherId") Long otherId);
}
