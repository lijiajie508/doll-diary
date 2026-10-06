package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.CommentDTO;
import com.dollshare.entity.Comment;
import com.dollshare.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 评论控制器
 */
@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /**
     * 某条动态的评论列表
     * GET /api/comment/list?dynamicId=1
     */
    @GetMapping("/list")
    public Result<List<Comment>> list(@RequestParam Long dynamicId) {
        return commentService.listByDynamic(dynamicId);
    }

    /**
     * 我的评论列表
     * GET /api/comment/mine
     */
    @GetMapping("/mine")
    public Result<List<Comment>> mine() {
        return commentService.mine();
    }

    /**
     * 发表评论
     * POST /api/comment
     */
    @PostMapping
    public Result<Void> add(@RequestBody @Valid CommentDTO dto) {
        return commentService.add(dto);
    }

    /**
     * 删除评论
     * DELETE /api/comment/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        return commentService.delete(id, request);
    }
}
