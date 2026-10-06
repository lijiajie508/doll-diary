package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 关注实体
 */
@Data
@TableName("follow")
public class Follow {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 关注者ID */
    private Long followerId;

    /** 被关注者ID */
    private Long followedId;

    private LocalDateTime createdAt;
}
