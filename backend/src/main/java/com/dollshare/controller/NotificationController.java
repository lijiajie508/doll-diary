package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.entity.Notification;
import com.dollshare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 通知控制器
 */
@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 我的通知列表
     * GET /api/notification/mine
     */
    @GetMapping("/mine")
    public Result<List<Notification>> mine() {
        return notificationService.mine();
    }

    /**
     * 我的未读通知数
     * GET /api/notification/unreadCount
     */
    @GetMapping("/unreadCount")
    public Result<Map<String, Object>> unreadCount() {
        return notificationService.unreadCount();
    }

    /**
     * 全部标记已读
     * POST /api/notification/readAll
     */
    @PostMapping("/readAll")
    public Result<Void> readAll() {
        return notificationService.readAll();
    }
}
