package com.dollshare.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 添加/编辑展示柜娃娃请求参数
 */
@Data
public class DollDTO {

    @NotBlank(message = "娃娃名称不能为空")
    @Size(max = 50, message = "娃娃名称最长 50 字")
    private String name;

    @Size(max = 30, message = "种类最长 30 字")
    private String type;

    private String imageUrl;

    @Size(max = 100, message = "购入渠道最长 100 字")
    private String buyChannel;

    @Size(max = 300, message = "描述最长 300 字")
    private String description;

    @DecimalMin(value = "0", message = "价格不能为负数")
    private BigDecimal price;

    private Integer visible;

    /** 所属娃柜ID（可空，空则放默认柜子） */
    private Long cabinetId;
}
