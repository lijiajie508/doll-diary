package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Dynamic;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 动态 Mapper
 */
@Mapper
public interface DynamicMapper extends BaseMapper<Dynamic> {

    /**
     * 首页信息流（分页）
     */
    @Select("SELECT d.*, u.nickname, u.avatar, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS like_count, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS comment_count, " +
            "EXISTS(SELECT 1 FROM favorite f WHERE f.dynamic_id = d.id AND f.user_id = #{userId}) AS liked, " +
            "dl.name AS doll_name, dl.image_url AS doll_image, dl.price AS doll_price, dl.type AS doll_type " +
            "FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "LEFT JOIN doll dl ON dl.id = d.doll_id " +
            "ORDER BY d.created_at DESC " +
            "LIMIT #{offset}, #{size}")
    List<Dynamic> selectFeed(@Param("userId") Long userId, @Param("offset") long offset, @Param("size") int size);

    /**
     * 某个用户的动态列表（个人主页/他人主页）
     */
    @Select("SELECT d.*, u.nickname, u.avatar, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS like_count, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS comment_count, " +
            "EXISTS(SELECT 1 FROM favorite f WHERE f.dynamic_id = d.id AND f.user_id = #{userId}) AS liked, " +
            "dl.name AS doll_name, dl.image_url AS doll_image, dl.price AS doll_price, dl.type AS doll_type " +
            "FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "LEFT JOIN doll dl ON dl.id = d.doll_id " +
            "WHERE d.user_id = #{targetUserId} " +
            "ORDER BY d.created_at DESC " +
            "LIMIT 100")
    List<Dynamic> selectUserFeed(@Param("targetUserId") Long targetUserId, @Param("userId") Long userId);

    /**
     * 搜索动态（按内容模糊匹配）
     */
    @Select("SELECT d.*, u.nickname, u.avatar, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS like_count, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS comment_count, " +
            "EXISTS(SELECT 1 FROM favorite f WHERE f.dynamic_id = d.id AND f.user_id = #{userId}) AS liked, " +
            "dl.name AS doll_name, dl.image_url AS doll_image, dl.price AS doll_price, dl.type AS doll_type " +
            "FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "LEFT JOIN doll dl ON dl.id = d.doll_id " +
            "WHERE d.content LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY d.created_at DESC " +
            "LIMIT 20")
    List<Dynamic> selectSearchDynamics(@Param("keyword") String keyword, @Param("userId") Long userId);

    /**
     * 我点赞过的动态列表
     */
    @Select("SELECT d.*, u.nickname, u.avatar, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS like_count, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS comment_count, " +
            "EXISTS(SELECT 1 FROM favorite f WHERE f.dynamic_id = d.id AND f.user_id = #{userId}) AS liked, " +
            "dl.name AS doll_name, dl.image_url AS doll_image, dl.price AS doll_price, dl.type AS doll_type " +
            "FROM favorite fav " +
            "JOIN dynamic d ON fav.dynamic_id = d.id " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "LEFT JOIN doll dl ON dl.id = d.doll_id " +
            "WHERE fav.user_id = #{userId} " +
            "ORDER BY fav.created_at DESC")
    List<Dynamic> selectLikedFeed(Long userId);

    /**
     * 热门动态 TopN（按点赞数/评论数排序，管理看板用）
     */
    @Select("SELECT d.id, d.content, d.created_at AS createdAt, u.nickname, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS likeCount, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS commentCount " +
            "FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "ORDER BY likeCount DESC, commentCount DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> selectHotDynamics(@Param("limit") int limit);

    /**
     * 管理员：全部动态列表（分页 + 关键词搜索）
     */
    @Select("SELECT d.id, d.user_id AS userId, d.content, d.images, d.created_at AS createdAt, u.nickname, " +
            "(SELECT COUNT(*) FROM favorite f WHERE f.dynamic_id = d.id) AS likeCount, " +
            "(SELECT COUNT(*) FROM comment c WHERE c.dynamic_id = d.id) AS commentCount " +
            "FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR d.content LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY d.created_at DESC " +
            "LIMIT #{offset}, #{size}")
    List<Map<String, Object>> selectAdminList(@Param("keyword") String keyword,
                                              @Param("offset") long offset,
                                              @Param("size") int size);

    /**
     * 管理员：动态列表总数（配合分页）
     */
    @Select("SELECT COUNT(*) FROM dynamic d " +
            "LEFT JOIN user u ON d.user_id = u.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR d.content LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%')")
    long countAdminList(@Param("keyword") String keyword);

    /**
     * 动态发布趋势：按天统计某时间点以来的发布数（看板柱状图）
     */
    @Select("SELECT DATE(created_at) AS day, COUNT(*) AS cnt " +
            "FROM dynamic " +
            "WHERE created_at >= #{start} " +
            "GROUP BY DATE(created_at) ORDER BY day")
    List<Map<String, Object>> selectDynamicTrend(@Param("start") java.time.LocalDateTime start);
}
