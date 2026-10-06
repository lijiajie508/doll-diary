package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.dto.DollDTO;
import com.dollshare.entity.Doll;
import com.dollshare.service.DollService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 展示柜娃娃控制器
 */
@RestController
@RequestMapping("/api/doll")
@RequiredArgsConstructor
public class DollController {

    private final DollService dollService;

    /**
     * 查看某个用户的展示柜（不登录也可看）
     * GET /api/doll/list?userId=2
     */
    @GetMapping("/list")
    public Result<List<Doll>> listByUser(@RequestParam Long userId) {
        return dollService.listByUser(userId);
    }

    /**
     * 查看自己的展示柜
     * GET /api/doll/mine
     */
    @GetMapping("/mine")
    public Result<List<Doll>> myList() {
        return dollService.myList();
    }

    /**
     * 添加娃娃，返回新娃娃ID
     * POST /api/doll
     */
    @PostMapping
    public Result<Long> add(@RequestBody @Valid DollDTO dto) {
        return dollService.add(dto);
    }

    /**
     * 娃娃详情（娃娃 + 主人 + 柜子）
     * GET /api/doll/{id}
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        return dollService.detail(id);
    }

    /**
     * 编辑娃娃
     * PUT /api/doll/{id}
     */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody @Valid DollDTO dto) {
        return dollService.update(id, dto);
    }

    /**
     * 删除娃娃
     * DELETE /api/doll/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return dollService.delete(id);
    }
}
