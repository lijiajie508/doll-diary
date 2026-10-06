package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理员操作日志：记录后台每一次管理操作（封禁/删除/处理举报等）
 */
@Data
@TableName("op_log")
public class OpLog {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 操作管理员ID */
    private Long adminId;

    /** 管理员昵称 */
    private String adminName;

    /** 操作类型，如 ban_user / delete_dynamic / handle_report */
    private String action;

    /** 操作对象类型：user / dynamic / comment / report */
    private String targetType;

    /** 操作对象ID */
    private Long targetId;

    /** 操作详情 */
    private String detail;

    /** 操作 IP */
    private String ip;

    /** 操作结果：成功 / 失败 */
    private String result;

    private LocalDateTime createdAt;
}
