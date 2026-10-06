package com.dollshare.service;

import com.dollshare.common.UserContext;
import com.dollshare.entity.OpLog;
import com.dollshare.entity.User;
import com.dollshare.mapper.OpLogMapper;
import com.dollshare.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 管理员操作日志服务：后台每一次管理操作（封禁/删除/处理举报等）落库留痕
 */
@Service
@RequiredArgsConstructor
public class OpLogService {

    private final OpLogMapper opLogMapper;
    private final UserMapper userMapper;

    /**
     * 记录一条管理员操作日志（日志失败不影响主流程）
     */
    public void record(String action, String targetType, Long targetId, String detail, String ip, String result) {
        try {
            Long adminId = UserContext.getUserId();
            User admin = adminId != null ? userMapper.selectById(adminId) : null;
            OpLog log = new OpLog();
            log.setAdminId(adminId);
            log.setAdminName(admin != null ? admin.getNickname() : null);
            log.setAction(action);
            log.setTargetType(targetType);
            log.setTargetId(targetId);
            log.setDetail(detail);
            log.setIp(ip);
            log.setResult(result);
            opLogMapper.insert(log);
        } catch (Exception ignored) {
            // 日志失败不阻塞主业务
        }
    }

    /**
     * 从请求中解析客户端 IP（兼容反向代理 X-Forwarded-For）
     */
    public String getIp(HttpServletRequest request) {
        try {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim();
            }
            return ip == null ? "" : ip;
        } catch (Exception e) {
            return "";
        }
    }
}
