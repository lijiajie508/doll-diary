package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.entity.Cabinet;
import com.dollshare.entity.Doll;
import com.dollshare.entity.User;
import com.dollshare.mapper.CabinetMapper;
import com.dollshare.mapper.DollMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 娃柜服务：柜子列表（含数量/总金额统计）、创建、重命名、删除
 * 说明：娃柜是普通用户的功能，管理员不开放
 */
@Service
@RequiredArgsConstructor
public class CabinetService {

    private final CabinetMapper cabinetMapper;
    private final DollMapper dollMapper;
    private final UserMapper userMapper;

    /**
     * 校验当前登录用户是否为管理员
     */
    private boolean isAdmin() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return false;
        }
        User me = userMapper.selectById(userId);
        return me != null && me.getRole() != null && me.getRole() == 2;
    }

    /**
     * 我的娃柜列表：每个柜子带 娃娃数量 和 总金额（元）
     */
    public Result<List<Map<String, Object>>> myList() {
        if (isAdmin()) {
            return Result.error(403, "娃柜仅普通用户可用");
        }
        Long userId = UserContext.getUserId();

        List<Cabinet> cabinets = cabinetMapper.selectList(
                new LambdaQueryWrapper<Cabinet>()
                        .eq(Cabinet::getUserId, userId)
                        .orderByAsc(Cabinet::getId));

        // 我的全部娃娃，按柜子分组统计数量与总价（价格按分累加避免浮点误差）
        List<Doll> dolls = dollMapper.selectList(
                new LambdaQueryWrapper<Doll>().eq(Doll::getUserId, userId));
        Map<Long, long[]> stat = new HashMap<>();
        for (Doll d : dolls) {
            long[] arr = stat.computeIfAbsent(d.getCabinetId(), k -> new long[2]);
            arr[0]++;
            if (d.getPrice() != null) {
                arr[1] += d.getPrice().movePointRight(2).longValue();
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Cabinet c : cabinets) {
            long[] arr = stat.getOrDefault(c.getId(), new long[2]);
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getName());
            m.put("visible", c.getVisible() != null ? c.getVisible() : 0);
            m.put("count", arr[0]);
            m.put("totalPrice", BigDecimal.valueOf(arr[1], 2));
            result.add(m);
        }
        return Result.success(result);
    }

    /**
     * 新建柜子（visible:0公开,1仅自己可见）
     */
    public Result<Void> create(String name, Integer visible) {
        if (isAdmin()) {
            return Result.error(403, "娃柜仅普通用户可用");
        }
        if (name == null || name.isBlank()) {
            return Result.error(500, "柜子名称不能为空");
        }
        Cabinet c = new Cabinet();
        c.setUserId(UserContext.getUserId());
        c.setName(name.trim());
        c.setVisible(visible != null && visible == 1 ? 1 : 0);
        cabinetMapper.insert(c);
        return Result.success();
    }

    /**
     * 编辑柜子：改名 / 切换可见性（只更新传入的字段）
     */
    public Result<Void> update(Long id, String name, Integer visible) {
        if (isAdmin()) {
            return Result.error(403, "娃柜仅普通用户可用");
        }
        Cabinet c = cabinetMapper.selectById(id);
        if (c == null || !c.getUserId().equals(UserContext.getUserId())) {
            return Result.error(500, "柜子不存在");
        }
        if (name != null && !name.isBlank()) {
            c.setName(name.trim());
        }
        if (visible != null) {
            c.setVisible(visible == 1 ? 1 : 0);
        }
        cabinetMapper.updateById(c);
        return Result.success();
    }

    /**
     * 删除柜子：柜内娃娃自动移到剩余的第一个柜子（没有则自动建"默认柜子"）
     */
    public Result<Void> delete(Long id) {
        if (isAdmin()) {
            return Result.error(403, "娃柜仅普通用户可用");
        }
        Long userId = UserContext.getUserId();
        Cabinet c = cabinetMapper.selectById(id);
        if (c == null || !c.getUserId().equals(userId)) {
            return Result.error(500, "柜子不存在");
        }

        // 找剩余第一个柜子作为迁移目标
        List<Cabinet> others = cabinetMapper.selectList(
                new LambdaQueryWrapper<Cabinet>()
                        .eq(Cabinet::getUserId, userId)
                        .ne(Cabinet::getId, id)
                        .orderByAsc(Cabinet::getId));
        Long fallbackId;
        if (!others.isEmpty()) {
            fallbackId = others.get(0).getId();
        } else {
            Cabinet nc = new Cabinet();
            nc.setUserId(userId);
            nc.setName("默认柜子");
            cabinetMapper.insert(nc);
            fallbackId = nc.getId();
        }

        Doll update = new Doll();
        update.setCabinetId(fallbackId);
        dollMapper.update(update,
                new LambdaQueryWrapper<Doll>().eq(Doll::getCabinetId, id));
        cabinetMapper.deleteById(id);
        return Result.success();
    }
}
