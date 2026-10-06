package com.dollshare.service;

import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.DynamicDTO;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.User;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.UserMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 动态服务：信息流、发布、删除
 */
@Service
@RequiredArgsConstructor
public class DynamicService {

    private final DynamicMapper dynamicMapper;
    private final UserMapper userMapper;
    private final OpLogService opLogService;

    /**
     * 当前登录用户是否为管理员
     */
    private boolean isAdmin() {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return false;
        }
        User me = userMapper.selectById(userId);
        return me != null && me.getRole() == 2;
    }

    /**
     * 信息流列表（分页，按时间倒序）
     */
    public Result<Map<String, Object>> feed(int page, int size) {
        Long userId = UserContext.getUserId();
        if (page < 1) {
            page = 1;
        }
        if (size < 1 || size > 50) {
            size = 10;
        }
        long offset = (long) (page - 1) * size;
        List<Dynamic> list = dynamicMapper.selectFeed(userId, offset, size);
        long total = dynamicMapper.selectCount(null);
        Map<String, Object> data = new HashMap<>();
        data.put("list", list);
        data.put("total", total);
        data.put("page", page);
        return Result.success(data);
    }

    /**
     * 某用户发布的动态（他人主页用）
     */
    public Result<List<Dynamic>> byUser(Long targetUserId) {
        Long meId = UserContext.getUserId();
        return Result.success(dynamicMapper.selectUserFeed(targetUserId, meId));
    }

    /**
     * 发布动态——仅普通用户
     */
    public Result<Void> publish(DynamicDTO dto) {
        if (isAdmin()) {
            throw new BusinessException(403, "管理员无需发布动态");
        }
        if (dto.getContent() == null || dto.getContent().isBlank()) {
            throw new BusinessException("动态内容不能为空");
        }
        Dynamic d = new Dynamic();
        d.setUserId(UserContext.getUserId());
        d.setContent(dto.getContent());
        d.setImages(dto.getImages());
        d.setDollId(dto.getDollId());
        dynamicMapper.insert(d);
        return Result.success();
    }

    /**
     * 删除动态：作者本人或管理员（管理员负责内容治理，删除留痕）
     */
    public Result<Void> delete(Long id, HttpServletRequest request) {
        Dynamic d = dynamicMapper.selectById(id);
        if (d == null) {
            throw new BusinessException("动态不存在");
        }
        Long userId = UserContext.getUserId();
        boolean isAdminNow = isAdmin();
        // 非本人且非管理员，无权删除
        if (!d.getUserId().equals(userId) && !isAdminNow) {
            throw new BusinessException(403, "无权删除该动态");
        }
        // 管理员删除他人的动态 → 记录操作日志
        if (isAdminNow && !d.getUserId().equals(userId)) {
            opLogService.record("delete_dynamic", "dynamic", id,
                    "删除动态 #" + id + "（作者 uid=" + d.getUserId() + "）",
                    opLogService.getIp(request), "成功");
        }
        dynamicMapper.deleteById(id);
        return Result.success();
    }
}
