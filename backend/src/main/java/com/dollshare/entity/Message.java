package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 私信实体
 */
@Data
@TableName("message")
public class Message {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long senderId;

    private Long receiverId;

    private String content;

    /** 0未读 1已读 */
    private Integer isRead;

    private LocalDateTime createdAt;

    // 非表字段：会话对方信息（会话列表用）
    @TableField(exist = false)
    private Long otherId;

    @TableField(exist = false)
    private String otherNickname;

    @TableField(exist = false)
    private String otherAvatar;
}
