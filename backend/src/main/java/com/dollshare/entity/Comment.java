package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评论实体
 */
@Data
@TableName("comment")
public class Comment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long dynamicId;

    private Long userId;

    private String content;

    private LocalDateTime createdAt;

    // 非表字段：评论者昵称（数据库表无此列，需标注）
    @TableField(exist = false)
    private String nickname;

    // 非表字段：被评论的动态内容、动态作者昵称（我的评论页用）
    @TableField(exist = false)
    private String dynamicContent;

    @TableField(exist = false)
    private String dynamicAuthorName;
}
