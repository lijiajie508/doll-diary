package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.ReportDTO;
import com.dollshare.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 举报控制器（用户端）：举报动态 / 评论 / 用户
 */
@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * 提交举报
     * POST /api/report
     * Body: {"type":"dynamic","targetId":3,"reason":"广告"}
     */
    @PostMapping
    public Result<Void> report(@RequestBody @Valid ReportDTO dto) {
        return reportService.report(dto);
    }
}
