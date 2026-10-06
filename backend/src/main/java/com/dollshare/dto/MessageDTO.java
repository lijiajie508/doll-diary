package com.dollshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 发送私信请求参数
 */
@Data
public class MessageDTO {

    @NotNull(message = "接收人不能为空")
    private Long receiverId;

    @NotBlank(message = "消息内容不能为空")
    @Size(max = 500, message = "消息最长 500 字")
    private String content;
}
