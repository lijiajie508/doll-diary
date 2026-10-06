package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知实体
 */
@Data
@TableName("notification")
public class Notification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 接收者ID */
    private Long userId;

    /** 类型：follow/like/comment */
    private String type;

    /** 触发者ID */
    private Long actorId;

    /** 关联动态ID（点赞/评论时） */
    private Long dynamicId;

    /** 0未读 1已读 */
    private Integer isRead;

    private LocalDateTime createdAt;

    // 非表字段：触发者昵称/头像
    @TableField(exist = false)
    private String actorNickname;

    @TableField(exist = false)
    private String actorAvatar;
}
