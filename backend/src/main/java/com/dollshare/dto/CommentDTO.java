package com.dollshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发表评论请求参数
 */
@Data
public class CommentDTO {

    @NotNull(message = "动态ID不能为空")
    private Long dynamicId;

    @NotBlank(message = "评论内容不能为空")
    @Size(max = 200, message = "评论最长 200 字")
    private String content;
}
