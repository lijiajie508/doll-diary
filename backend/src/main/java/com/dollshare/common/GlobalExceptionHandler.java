package com.dollshare.common;

import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理：统一兜底，保证任何异常都返回 Result 结构而不是裸堆栈
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 业务异常（BusinessException）：业务校验不通过
     * 例如：用户名或密码错误、账号被占用、只能编辑自己的娃娃等
     */
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusiness(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }

    /**
     * 参数校验失败（@Valid 注解触发）：返回第一个字段的错误提示
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValid(MethodArgumentNotValidException e) {
        FieldError fe = e.getBindingResult().getFieldError();
        String msg = fe != null && fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "参数校验失败";
        return Result.error(400, msg);
    }

    /**
     * 兜底异常：未预期错误，统一返回友好提示，避免堆栈信息泄露
     */
    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        return Result.error(500, "服务器开小差了，请稍后再试");
    }
}
