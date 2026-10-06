package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.DollDTO;
import com.dollshare.entity.Cabinet;
import com.dollshare.entity.Doll;
import com.dollshare.entity.User;
import com.dollshare.mapper.CabinetMapper;
import com.dollshare.mapper.DollMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 展示柜娃娃服务：列表、添加、编辑、删除
 * 说明：展示柜是普通用户的功能，管理员账号不开放娃柜操作
 */
@Service
@RequiredArgsConstructor
public class DollService {

    private final DollMapper dollMapper;
    private final UserMapper userMapper;
    private final CabinetMapper cabinetMapper;

    /**
     * 校验当前登录用户是否为管理员（娃柜仅普通用户可用）
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
     * 查看某个用户的展示柜（他人只能看到公开的）
     */
    public Result<List<Doll>> listByUser(Long userId) {
        Long me = UserContext.getUserId();
        LambdaQueryWrapper<Doll> qw = new LambdaQueryWrapper<Doll>()
                .eq(Doll::getUserId, userId);
        // 仅自己可见的娃娃，只有本人能看到
        if (me == null || !me.equals(userId)) {
            qw.eq(Doll::getVisible, 0);
            // 柜子级私密：仅自己可见的柜子，整柜娃娃对他人隐藏
            List<Cabinet> privateCabs = cabinetMapper.selectList(
                    new LambdaQueryWrapper<Cabinet>()
                            .eq(Cabinet::getUserId, userId)
                            .eq(Cabinet::getVisible, 1));
            if (!privateCabs.isEmpty()) {
                List<Long> privateCabIds = privateCabs.stream().map(Cabinet::getId).toList();
                // 排除私密柜里的娃娃；不在任何柜子的娃娃（cabinet_id 为空）仍公开
                qw.and(w -> w.notIn(Doll::getCabinetId, privateCabIds).or().isNull(Doll::getCabinetId));
            }
        }
        qw.orderByDesc(Doll::getCreatedAt);
        return Result.success(dollMapper.selectList(qw));
    }

    /**
     * 查看自己的展示柜（含私密娃娃）——仅普通用户
     */
    public Result<List<Doll>> myList() {
        if (isAdmin()) {
            return Result.error(403, "展示柜仅普通用户可用");
        }
        return listByUser(UserContext.getUserId());
    }

    /**
     * 获取用户的默认柜子ID：取第一个柜子，没有则自动创建一个"默认柜子"
     */
    private Long getDefaultCabinetId(Long userId) {
        Cabinet first = cabinetMapper.selectOne(
                new LambdaQueryWrapper<Cabinet>()
                        .eq(Cabinet::getUserId, userId)
                        .orderByAsc(Cabinet::getId)
                        .last("LIMIT 1"));
        if (first != null) {
            return first.getId();
        }
        Cabinet c = new Cabinet();
        c.setUserId(userId);
        c.setName("默认柜子");
        cabinetMapper.insert(c);
        return c.getId();
    }

    /**
     * 添加娃娃到柜子——仅普通用户；返回新娃娃ID（用于同步发布动态时关联）
     */
    public Result<Long> add(DollDTO dto) {
        if (isAdmin()) {
            return Result.error(403, "展示柜仅普通用户可用");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            return Result.error(500, "娃娃名字不能为空");
        }
        Long userId = UserContext.getUserId();
        Doll doll = new Doll();
        doll.setUserId(userId);
        doll.setCabinetId(dto.getCabinetId() != null ? dto.getCabinetId() : getDefaultCabinetId(userId));
        doll.setName(dto.getName());
        doll.setType(dto.getType());
        doll.setImageUrl(dto.getImageUrl());
        doll.setBuyChannel(dto.getBuyChannel());
        doll.setDescription(dto.getDescription());
        doll.setPrice(dto.getPrice());
        doll.setVisible(dto.getVisible() != null ? dto.getVisible() : 0);
        dollMapper.insert(doll);
        return Result.success(doll.getId());
    }

    /**
     * 编辑娃娃：只能编辑自己的——仅普通用户
     */
    public Result<Void> update(Long id, DollDTO dto) {
        if (isAdmin()) {
            return Result.error(403, "展示柜仅普通用户可用");
        }
        Doll doll = dollMapper.selectById(id);
        if (doll == null) {
            return Result.error(500, "娃娃不存在");
        }
        if (!doll.getUserId().equals(UserContext.getUserId())) {
            return Result.error(403, "只能编辑自己的娃娃");
        }
        doll.setName(dto.getName());
        doll.setType(dto.getType());
        doll.setImageUrl(dto.getImageUrl());
        doll.setBuyChannel(dto.getBuyChannel());
        doll.setDescription(dto.getDescription());
        doll.setPrice(dto.getPrice());
        doll.setVisible(dto.getVisible() != null ? dto.getVisible() : doll.getVisible());
        if (dto.getCabinetId() != null) {
            doll.setCabinetId(dto.getCabinetId());
        }
        dollMapper.updateById(doll);
        return Result.success();
    }

    /**
     * 娃娃详情：娃娃 + 主人 + 所属柜子
     * 公开娃娃任何人可看；仅自己可见的只有本人可看
     */
    public Result<Map<String, Object>> detail(Long id) {
        Doll doll = dollMapper.selectById(id);
        if (doll == null) {
            return Result.error(500, "娃娃不存在");
        }
        Long me = UserContext.getUserId();
        if (doll.getVisible() != null && doll.getVisible() == 1) {
            if (me == null || !me.equals(doll.getUserId())) {
                return Result.error(403, "这只娃娃仅主人可见");
            }
        }
        Map<String, Object> data = new HashMap<>();
        data.put("doll", doll);
        User owner = userMapper.selectById(doll.getUserId());
        data.put("owner", owner);
        if (doll.getCabinetId() != null) {
            Cabinet cab = cabinetMapper.selectById(doll.getCabinetId());
            data.put("cabinetName", cab != null ? cab.getName() : null);
            // 柜子级私密：整柜仅主人可见
            if (cab != null && cab.getVisible() != null && cab.getVisible() == 1) {
                if (me == null || !me.equals(doll.getUserId())) {
                    return Result.error(403, "这只娃娃所在的柜子是私密的");
                }
            }
        } else {
            data.put("cabinetName", null);
        }
        return Result.success(data);
    }

    /**
     * 删除娃娃：只能删除自己的——仅普通用户
     */
    public Result<Void> delete(Long id) {
        if (isAdmin()) {
            return Result.error(403, "展示柜仅普通用户可用");
        }
        Doll doll = dollMapper.selectById(id);
        if (doll == null) {
            return Result.error(500, "娃娃不存在");
        }
        if (!doll.getUserId().equals(UserContext.getUserId())) {
            return Result.error(403, "只能删除自己的娃娃");
        }
        dollMapper.deleteById(id);
        return Result.success();
    }
}
