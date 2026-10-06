package com.dollshare.common;

import lombok.Getter;

/**
 * 业务异常：业务校验不通过时抛出，由 GlobalExceptionHandler 统一捕获返回
 */
@Getter
public class BusinessException extends RuntimeException {

    /** 业务错误码：默认 500（业务失败），也可指定 400/403 等 */
    private final int code;

    public BusinessException(String message) {
        this(500, message);
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}
