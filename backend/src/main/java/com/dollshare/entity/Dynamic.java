package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 动态实体（首页信息流）
 */
@Data
@TableName("dynamic")
public class Dynamic {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String content;

    /** 图片URL，多张用逗号分隔 */
    private String images;

    /** 关联的柜中娃娃ID（可空） */
    private Long dollId;

    private LocalDateTime createdAt;

    // ===== 非表字段，列表展示时由 Service 填充（数据库表无这些列，需标注）=====
    /** 作者昵称 */
    @TableField(exist = false)
    private String nickname;

    /** 作者头像 */
    @TableField(exist = false)
    private String avatar;

    /** 点赞数 */
    @TableField(exist = false)
    private Long likeCount;

    /** 评论数 */
    @TableField(exist = false)
    private Long commentCount;

    /** 当前登录用户是否已点赞 */
    @TableField(exist = false)
    private Boolean liked;

    /** 关联娃娃：名字（列表查询 JOIN 带出） */
    @TableField(exist = false)
    private String dollName;

    /** 关联娃娃：图片 */
    @TableField(exist = false)
    private String dollImage;

    /** 关联娃娃：价格 */
    @TableField(exist = false)
    private java.math.BigDecimal dollPrice;

    /** 关联娃娃：种类 */
    @TableField(exist = false)
    private String dollType;
}
