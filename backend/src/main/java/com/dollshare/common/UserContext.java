package com.dollshare.common;

/**
 * 当前登录用户上下文（ThreadLocal）
 * 拦截器解析 token 后把用户 id 放进来，各业务接口从这里取
 */
public class UserContext {

    private static final ThreadLocal<Long> CURRENT_USER = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        CURRENT_USER.set(userId);
    }

    public static Long getUserId() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
