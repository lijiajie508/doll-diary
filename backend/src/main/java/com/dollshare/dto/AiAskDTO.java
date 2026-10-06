package com.dollshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * AI 助手提问参数
 */
@Data
public class AiAskDTO {

    @NotBlank(message = "问题不能为空")
    @Size(max = 200, message = "问题最长 200 字")
    private String question;
}
