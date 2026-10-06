package com.dollshare.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发布动态请求参数
 */
@Data
public class DynamicDTO {

    @Size(max = 500, message = "文案最长 500 字")
    private String content;

    /** 图片URL，多张用逗号分隔（可空） */
    @Size(max = 1000, message = "图片数据过长")
    private String images;

    /** 关联的柜中娃娃ID（可空） */
    private Long dollId;
}
