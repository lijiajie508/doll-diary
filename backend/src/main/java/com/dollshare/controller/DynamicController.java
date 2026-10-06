package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.DynamicDTO;
import com.dollshare.entity.Dynamic;
import com.dollshare.service.DynamicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 动态控制器
 */
@RestController
@RequestMapping("/api/dynamic")
@RequiredArgsConstructor
public class DynamicController {

    private final DynamicService dynamicService;

    /**
     * 信息流列表（分页）
     * GET /api/dynamic/feed?page=1&size=10
     */
    @GetMapping("/feed")
    public Result<Map<String, Object>> feed(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return dynamicService.feed(page, size);
    }

    /**
     * 某用户发布的动态（他人主页用）
     * GET /api/dynamic/byUser?userId=2
     */
    @GetMapping("/byUser")
    public Result<List<Dynamic>> byUser(@RequestParam Long userId) {
        return dynamicService.byUser(userId);
    }

    /**
     * 发布动态
     * POST /api/dynamic
     */
    @PostMapping
    public Result<Void> publish(@RequestBody @Valid DynamicDTO dto) {
        return dynamicService.publish(dto);
    }

    /**
     * 删除动态
     * DELETE /api/dynamic/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        return dynamicService.delete(id, request);
    }
}
