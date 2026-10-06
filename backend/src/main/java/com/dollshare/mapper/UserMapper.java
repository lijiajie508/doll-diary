package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 用户 Mapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 用户列表（分页 + 关键词搜索），带动态数/娃娃数统计
     */
    @Select("SELECT u.id, u.username, u.nickname, u.avatar, u.role, u.status, u.created_at AS createdAt, " +
            "(SELECT COUNT(*) FROM dynamic d WHERE d.user_id = u.id) AS dynamicCount, " +
            "(SELECT COUNT(*) FROM doll dl WHERE dl.user_id = u.id) AS dollCount " +
            "FROM user u " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR u.username LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY u.created_at DESC " +
            "LIMIT #{offset}, #{size}")
    List<Map<String, Object>> selectUserList(@Param("keyword") String keyword,
                                             @Param("offset") long offset,
                                             @Param("size") int size);

    /**
     * 用户列表总数（配合分页）
     */
    @Select("SELECT COUNT(*) FROM user u " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR u.username LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%')")
    long countUsers(@Param("keyword") String keyword);

    /**
     * 活跃用户 TopN（按动态数排序）
     */
    @Select("SELECT u.id, u.nickname, u.avatar, " +
            "(SELECT COUNT(*) FROM dynamic d WHERE d.user_id = u.id) AS dynamicCount, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.user_id = u.id) AS commentCount, " +
            "(SELECT COUNT(*) FROM doll dl WHERE dl.user_id = u.id) AS dollCount " +
            "FROM user u " +
            "ORDER BY dynamicCount DESC, commentCount DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> selectActiveUsers(@Param("limit") int limit);

    /**
     * 搜索用户（普通用户，按昵称/用户名模糊匹配）
     */
    @Select("SELECT u.id, u.username, u.nickname, u.avatar " +
            "FROM user u " +
            "WHERE u.role = 1 " +
            "  AND (u.nickname LIKE CONCAT('%', #{keyword}, '%') " +
            "    OR u.username LIKE CONCAT('%', #{keyword}, '%')) " +
            "ORDER BY u.created_at DESC " +
            "LIMIT 20")
    List<Map<String, Object>> selectSearchUsers(@Param("keyword") String keyword);

    /**
     * 注册趋势：按天统计某时间点以来的注册数（看板柱状图）
     */
    @Select("SELECT DATE(created_at) AS day, COUNT(*) AS cnt " +
            "FROM user " +
            "WHERE created_at >= #{start} " +
            "GROUP BY DATE(created_at) ORDER BY day")
    List<Map<String, Object>> selectRegisterTrend(@Param("start") java.time.LocalDateTime start);
}
