package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 举报实体：用户举报动态/评论/用户，管理员处理后形成内容治理闭环
 */
@Data
@TableName("report")
public class Report {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 举报类型：dynamic 动态 / comment 评论 / user 用户 */
    private String type;

    /** 被举报对象ID（动态ID/评论ID/用户ID） */
    private Long targetId;

    /** 举报人ID */
    private Long reporterId;

    /** 举报原因 */
    private String reason;

    /** 0 待处理 / 1 已处理（删除内容或封禁）/ 2 已忽略 */
    private Integer status;

    /** 处理人（管理员ID） */
    private Long handledBy;

    /** 处理时间 */
    private LocalDateTime handledAt;

    private LocalDateTime createdAt;
}
