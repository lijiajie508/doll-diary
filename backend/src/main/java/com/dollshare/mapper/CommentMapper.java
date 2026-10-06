package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 评论 Mapper
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {

    /**
     * 按动态查评论列表，带出评论者昵称
     */
    @Select("SELECT c.*, u.nickname FROM comment c " +
            "LEFT JOIN user u ON c.user_id = u.id " +
            "WHERE c.dynamic_id = #{dynamicId} " +
            "ORDER BY c.created_at ASC")
    List<Comment> selectByDynamicId(Long dynamicId);

    /**
     * 我的评论：带出被评论的动态内容 + 动态作者昵称
     */
    @Select("SELECT c.*, u.nickname, d.content AS dynamic_content, du.nickname AS dynamic_author_name " +
            "FROM comment c " +
            "LEFT JOIN user u ON c.user_id = u.id " +
            "LEFT JOIN dynamic d ON c.dynamic_id = d.id " +
            "LEFT JOIN user du ON d.user_id = du.id " +
            "WHERE c.user_id = #{userId} " +
            "ORDER BY c.created_at DESC")
    List<Comment> selectMine(Long userId);

    /**
     * 管理员：全部评论列表（分页 + 关键词搜索）
     */
    @Select("SELECT c.id, c.dynamic_id AS dynamicId, c.user_id AS userId, c.content, c.created_at AS createdAt, " +
            "u.nickname, d.content AS dynamicContent " +
            "FROM comment c " +
            "LEFT JOIN user u ON c.user_id = u.id " +
            "LEFT JOIN dynamic d ON c.dynamic_id = d.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR c.content LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY c.created_at DESC " +
            "LIMIT #{offset}, #{size}")
    List<Map<String, Object>> selectAdminList(@Param("keyword") String keyword,
                                              @Param("offset") long offset,
                                              @Param("size") int size);

    /**
     * 管理员：评论列表总数（配合分页）
     */
    @Select("SELECT COUNT(*) FROM comment c " +
            "LEFT JOIN user u ON c.user_id = u.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR c.content LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%')")
    long countAdminList(@Param("keyword") String keyword);
}
