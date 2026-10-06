package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 展示柜娃娃实体
 */
@Data
@TableName("doll")
public class Doll {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 所属娃柜ID */
    private Long cabinetId;

    private String name;

    /** 种类：如 BJD/棉花娃/毛绒 */
    private String type;

    private String imageUrl;

    private String buyChannel;

    private String description;

    /** 价格（元） */
    private BigDecimal price;

    /** 可见性：0公开 / 1仅自己可见 */
    private Integer visible;

    private LocalDateTime createdAt;

    // 非表字段：所属用户昵称（数据库表无此列，需标注，否则 MyBatis-Plus 会当表字段查）
    @TableField(exist = false)
    private String nickname;
}
