package com.dollshare.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dollshare.entity.Doll;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 展示柜娃娃 Mapper
 */
@Mapper
public interface DollMapper extends BaseMapper<Doll> {

    /**
     * 管理员：全部娃娃列表（分页 + 关键词搜索）
     */
    @Select("SELECT dl.id, dl.user_id AS userId, dl.name, dl.type, dl.image_url AS imageUrl, " +
            "dl.buy_channel AS buyChannel, dl.description, dl.price, dl.visible, dl.created_at AS createdAt, " +
            "u.nickname " +
            "FROM doll dl LEFT JOIN user u ON dl.user_id = u.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR dl.name LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY dl.created_at DESC " +
            "LIMIT #{offset}, #{size}")
    List<Map<String, Object>> selectAdminList(@Param("keyword") String keyword,
                                              @Param("offset") long offset,
                                              @Param("size") int size);

    /**
     * 管理员：娃娃列表总数（配合分页）
     */
    @Select("SELECT COUNT(*) FROM doll dl " +
            "LEFT JOIN user u ON dl.user_id = u.id " +
            "WHERE #{keyword} IS NULL OR #{keyword} = '' " +
            "   OR dl.name LIKE CONCAT('%', #{keyword}, '%') " +
            "   OR u.nickname LIKE CONCAT('%', #{keyword}, '%')")
    long countAdminList(@Param("keyword") String keyword);

    /**
     * 搜索娃娃（只搜公开的，带主人昵称/头像）
     */
    @Select("SELECT dl.id, dl.user_id AS userId, dl.name, dl.type, dl.image_url AS imageUrl, dl.price, " +
            "dl.created_at AS createdAt, u.nickname, u.avatar " +
            "FROM doll dl LEFT JOIN user u ON dl.user_id = u.id " +
            "WHERE dl.visible = 0 " +
            "  AND (dl.name LIKE CONCAT('%', #{keyword}, '%') " +
            "    OR dl.type LIKE CONCAT('%', #{keyword}, '%')) " +
            "ORDER BY dl.created_at DESC " +
            "LIMIT 20")
    List<Map<String, Object>> selectSearchDolls(@Param("keyword") String keyword);

    /**
     * 某用户某时间以来的娃娃统计：数量 / 总花费 / 最贵价格（年度报告用）
     */
    @Select("SELECT COUNT(*) AS count, COALESCE(SUM(price), 0) AS total, COALESCE(MAX(price), 0) AS maxPrice " +
            "FROM doll " +
            "WHERE user_id = #{userId} AND created_at >= #{start}")
    Map<String, Object> selectStatsSince(@Param("userId") Long userId, @Param("start") java.time.LocalDateTime start);

    /**
     * 某用户某时间以来最贵的娃娃名字
     */
    @Select("SELECT name FROM doll " +
            "WHERE user_id = #{userId} AND created_at >= #{start} AND price IS NOT NULL " +
            "ORDER BY price DESC LIMIT 1")
    String selectMostExpensiveName(@Param("userId") Long userId, @Param("start") java.time.LocalDateTime start);
}
