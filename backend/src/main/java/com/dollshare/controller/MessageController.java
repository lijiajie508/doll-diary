package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.MessageDTO;
import com.dollshare.entity.Message;
import com.dollshare.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 私信控制器
 */
@RestController
@RequestMapping("/api/message")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * 会话列表
     * GET /api/message/conversations
     */
    @GetMapping("/conversations")
    public Result<List<Map<String, Object>>> conversations() {
        return messageService.conversations();
    }

    /**
     * 与某人的聊天记录
     * GET /api/message/thread?otherId=2
     */
    @GetMapping("/thread")
    public Result<List<Message>> thread(@RequestParam Long otherId) {
        return messageService.thread(otherId);
    }

    /**
     * 发送私信
     * POST /api/message/send
     */
    @PostMapping("/send")
    public Result<Void> send(@RequestBody @Valid MessageDTO dto) {
        return messageService.send(dto);
    }

    /**
     * 标记与某人的消息全部已读
     * POST /api/message/read?otherId=2
     */
    @PostMapping("/read")
    public Result<Void> markRead(@RequestParam Long otherId) {
        return messageService.markRead(otherId);
    }

    /**
     * 我的未读私信总数
     * GET /api/message/unreadTotal
     */
    @GetMapping("/unreadTotal")
    public Result<Map<String, Object>> unreadTotal() {
        return messageService.unreadTotal();
    }
}
