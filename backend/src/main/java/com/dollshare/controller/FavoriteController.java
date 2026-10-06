package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.entity.Dynamic;
import com.dollshare.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 点赞控制器
 */
@RestController
@RequestMapping("/api/favorite")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 点赞/取消点赞
     * POST /api/favorite/toggle?dynamicId=1
     */
    @PostMapping("/toggle")
    public Result<Map<String, Object>> toggle(@RequestParam Long dynamicId) {
        return favoriteService.toggle(dynamicId);
    }

    /**
     * 我点赞过的动态
     * GET /api/favorite/mine
     */
    @GetMapping("/mine")
    public Result<List<Dynamic>> mine() {
        return favoriteService.mine();
    }
}
