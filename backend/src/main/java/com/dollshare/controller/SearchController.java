package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 搜索控制器
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * 统一搜索：用户/娃娃/动态
     * GET /api/search?keyword=美乐蒂
     */
    @GetMapping
    public Result<Map<String, Object>> search(@RequestParam String keyword) {
        return Result.success(searchService.search(keyword));
    }
}
