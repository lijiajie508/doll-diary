package com.dollshare.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 娃柜实体（一个用户可建多个柜子）
 */
@Data
@TableName("cabinet")
public class Cabinet {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    /** 柜子名称，如 "Kitty 专柜" */
    private String name;

    /** 可见性:0公开,1仅自己可见 */
    private Integer visible;

    private LocalDateTime createdAt;
}
