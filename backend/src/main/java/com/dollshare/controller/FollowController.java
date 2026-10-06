package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 关注控制器
 */
@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * 关注/取消关注
     * POST /api/follow/toggle?followedId=2
     */
    @PostMapping("/toggle")
    public Result<Map<String, Object>> toggle(@RequestParam Long followedId) {
        return followService.toggle(followedId);
    }

    /**
     * 我是否已关注某用户
     * GET /api/follow/status?followedId=2
     */
    @GetMapping("/status")
    public Result<Boolean> status(@RequestParam Long followedId) {
        return followService.status(followedId);
    }

    /**
     * 我的关注数 / 粉丝数
     * GET /api/follow/counts
     */
    @GetMapping("/counts")
    public Result<Map<String, Object>> counts() {
        return followService.counts();
    }

    /**
     * 我关注的人列表
     * GET /api/follow/following
     */
    @GetMapping("/following")
    public Result<List<Map<String, Object>>> following() {
        return followService.following();
    }

    /**
     * 我的粉丝列表
     * GET /api/follow/fans
     */
    @GetMapping("/fans")
    public Result<List<Map<String, Object>>> fans() {
        return followService.fans();
    }
}
