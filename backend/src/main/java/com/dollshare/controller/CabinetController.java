package com.dollshare.controller;

import com.dollshare.common.Result;
import com.dollshare.service.CabinetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 娃柜控制器
 */
@RestController
@RequestMapping("/api/cabinet")
@RequiredArgsConstructor
public class CabinetController {

    private final CabinetService cabinetService;

    /**
     * 我的娃柜列表（含数量/总金额）
     * GET /api/cabinet/mine
     */
    @GetMapping("/mine")
    public Result<List<Map<String, Object>>> myList() {
        return cabinetService.myList();
    }

    /**
     * 新建柜子
     * POST /api/cabinet?name=Kitty专柜&visible=0（visible:0公开,1仅自己可见）
     */
    @PostMapping
    public Result<Void> create(@RequestParam String name, @RequestParam(required = false) Integer visible) {
        return cabinetService.create(name, visible);
    }

    /**
     * 编辑柜子：改名 / 切换可见性
     * PUT /api/cabinet/{id}?name=新名字&visible=1
     */
    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id,
                               @RequestParam(required = false) String name,
                               @RequestParam(required = false) Integer visible) {
        return cabinetService.update(id, name, visible);
    }

    /**
     * 删除柜子（柜内娃娃自动移到其他柜）
     * DELETE /api/cabinet/{id}
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        return cabinetService.delete(id);
    }
}
