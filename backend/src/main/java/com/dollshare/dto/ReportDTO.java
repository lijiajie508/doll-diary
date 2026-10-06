package com.dollshare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 举报请求参数
 */
@Data
public class ReportDTO {

    /** 举报类型：dynamic / comment / user */
    @NotBlank(message = "举报类型不能为空")
    private String type;

    /** 被举报对象ID */
    @NotNull(message = "举报对象不能为空")
    private Long targetId;

    /** 举报原因 */
    @Size(max = 200, message = "举报原因最长 200 字")
    private String reason;
}
