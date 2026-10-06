package com.dollshare.service;

import com.dollshare.common.UserContext;
import com.dollshare.mapper.DollMapper;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 搜索服务：统一搜索用户/娃娃/动态
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserMapper userMapper;
    private final DollMapper dollMapper;
    private final DynamicMapper dynamicMapper;

    public Map<String, Object> search(String keyword) {
        String kw = keyword == null ? "" : keyword.trim();
        Map<String, Object> data = new HashMap<>();
        if (kw.isEmpty()) {
            data.put("users", java.util.List.of());
            data.put("dolls", java.util.List.of());
            data.put("dynamics", java.util.List.of());
            return data;
        }
        Long meId = UserContext.getUserId();
        data.put("users", userMapper.selectSearchUsers(kw));
        data.put("dolls", dollMapper.selectSearchDolls(kw));
        data.put("dynamics", dynamicMapper.selectSearchDynamics(kw, meId));
        return data;
    }
}
