package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@TableName("user")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    /** 密码不返回给前端，加 @JsonIgnore 忽略序列化 */
    @JsonIgnore
    private String password;

    private String nickname;

    private String avatar;

    /** 个人简介 */
    private String intro;

    /** 主页背景图URL */
    private String bgImage;

    /** 角色：1=普通用户，2=管理员 */
    private Integer role;

    /** 状态：1=正常，0=封禁 */
    private Integer status;

    private LocalDateTime createdAt;
}
