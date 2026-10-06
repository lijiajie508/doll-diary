package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.AiAskDTO;
import com.dollshare.entity.AiMessage;
import com.dollshare.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * AI 助手控制器：问平台数据（自己的娃娃柜 + 公开娃娃）
 * POST /api/ai/ask {"question":"我今天添加了娃娃吗？"}
 * GET  /api/ai/history 最近聊天记录
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/ask")
    public Result<String> ask(@RequestBody @Valid AiAskDTO dto) {
        return Result.success(aiService.ask(dto.getQuestion()));
    }

    @GetMapping("/history")
    public Result<List<AiMessage>> history() {
        return Result.success(aiService.history());
    }
}
