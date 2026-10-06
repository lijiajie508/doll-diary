package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.service.AdminService;
import com.dollshare.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理员控制器：数据看板、用户管理、举报处理、操作日志
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;

    /**
     * 数据看板统计
     * GET /api/admin/stats（需管理员）
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return adminService.stats();
    }

    /**
     * 用户列表（分页 + 关键词搜索）
     * GET /api/admin/users?page=1&size=10&keyword=xx（需管理员）
     */
    @GetMapping("/users")
    public Result<Map<String, Object>> users(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return adminService.users(page, size, keyword);
    }

    /**
     * 封禁 / 解封用户
     * PUT /api/admin/user/{id}/status?status=0|1（需管理员）
     */
    @PutMapping("/user/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status, HttpServletRequest request) {
        return adminService.updateStatus(id, status, request);
    }

    /**
     * 动态列表（分页 + 关键词搜索）
     * GET /api/admin/dynamics?page=1&size=10&keyword=xx（需管理员）
     */
    @GetMapping("/dynamics")
    public Result<Map<String, Object>> dynamics(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return adminService.dynamics(page, size, keyword);
    }

    /**
     * 评论列表（分页 + 关键词搜索）
     * GET /api/admin/comments?page=1&size=10&keyword=xx（需管理员）
     */
    @GetMapping("/comments")
    public Result<Map<String, Object>> comments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return adminService.comments(page, size, keyword);
    }

    /**
     * 娃娃列表（分页 + 关键词搜索）
     * GET /api/admin/dolls?page=1&size=10&keyword=xx（需管理员）
     */
    @GetMapping("/dolls")
    public Result<Map<String, Object>> dolls(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword) {
        return adminService.dolls(page, size, keyword);
    }

    /**
     * 举报列表（分页 + 状态筛选，0待处理/1已处理/2已忽略）
     * GET /api/admin/reports?page=1&size=10&status=0（需管理员）
     */
    @GetMapping("/reports")
    public Result<Map<String, Object>> reports(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer status) {
        return reportService.list(page, size, status);
    }

    /**
     * 处理举报
     * POST /api/admin/reports/{id}/handle?action=ignore|delete|ban（需管理员）
     * ignore=忽略 delete=删除内容 ban=封禁用户并删除内容
     */
    @PostMapping("/reports/{id}/handle")
    public Result<Void> handleReport(@PathVariable Long id,
                                     @RequestParam String action,
                                     HttpServletRequest request) {
        return reportService.handle(id, action, request);
    }

    /**
     * 管理员操作日志列表（分页）
     * GET /api/admin/opLogs?page=1&size=10（需管理员）
     */
    @GetMapping("/opLogs")
    public Result<Map<String, Object>> opLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return adminService.opLogs(page, size);
    }
}
