package com.dollshare.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.common.UserContext;
import com.dollshare.dto.LoginDTO;
import com.dollshare.dto.RegisterDTO;
import com.dollshare.entity.Cabinet;
import com.dollshare.entity.Doll;
import com.dollshare.entity.Dynamic;
import com.dollshare.entity.Favorite;
import com.dollshare.entity.Follow;
import com.dollshare.entity.User;
import com.dollshare.mapper.CabinetMapper;
import com.dollshare.mapper.DollMapper;
import com.dollshare.mapper.DynamicMapper;
import com.dollshare.mapper.FavoriteMapper;
import com.dollshare.mapper.FollowMapper;
import com.dollshare.mapper.UserMapper;
import com.dollshare.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户服务：登录、注册
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final DynamicMapper dynamicMapper;
    private final DollMapper dollMapper;
    private final FollowMapper followMapper;
    private final FavoriteMapper favoriteMapper;
    private final CabinetMapper cabinetMapper;

    /**
     * 登录：校验用户名密码，成功后返回 token + 用户信息
     */
    public Result<Map<String, Object>> login(LoginDTO dto) {
        // 1. 按用户名查用户
        User user = userMapper.selectOne(
                new LambdaQueryWrapper<User>()
                        .eq(User::getUsername, dto.getUsername()));

        // 2. 用户不存在或密码错误（BCrypt校验，防止明文比对）
        if (user == null || !passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        // 3. 账号被封禁
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException("账号已被封禁");
        }

        // 4. 生成 token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole());

        // 5. 组装返回数据（不含密码）
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("id", user.getId());
        data.put("username", user.getUsername());
        data.put("nickname", user.getNickname());
        data.put("avatar", user.getAvatar());
        data.put("role", user.getRole());

        return Result.success(data);
    }

    /**
     * 注册：用户名唯一，默认角色普通用户，头像可选
     */
    public Result<Void> register(RegisterDTO dto, String avatar) {
        // 1. 校验参数
        if (dto.getUsername() == null || dto.getUsername().isBlank()
                || dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new BusinessException("用户名和密码不能为空");
        }

        // 2. 用户名是否已存在
        Long count = userMapper.selectCount(
                new LambdaQueryWrapper<User>().eq(User::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BusinessException("用户名已被占用");
        }

        // 3. 保存新用户（密码BCrypt加密存储）
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setNickname(dto.getNickname() == null ? dto.getUsername() : dto.getNickname());
        user.setAvatar(avatar);
        user.setRole(1);
        user.setStatus(1);
        userMapper.insert(user);
        return Result.success();
    }

    /**
     * 更新当前登录用户头像
     */
    public Result<String> updateAvatar(String avatar) {
        Long userId = UserContext.getUserId();
        User user = new User();
        user.setId(userId);
        user.setAvatar(avatar);
        userMapper.updateById(user);
        return Result.success(avatar);
    }

    /**
     * 更新个人资料：昵称/简介/背景图（null 表示不修改）
     */
    public Result<Void> updateProfile(String nickname, String intro, String bgImage) {
        Long userId = UserContext.getUserId();
        User user = new User();
        user.setId(userId);
        if (nickname != null) user.setNickname(nickname.trim());
        if (intro != null) user.setIntro(intro.trim());
        if (bgImage != null) user.setBgImage(bgImage.trim());
        userMapper.updateById(user);
        return Result.success();
    }

    /**
     * 用户公开资料（他人主页用）：基础信息 + 各内容数量 + 关注/粉丝数 + 我是否已关注
     */
    public Result<Map<String, Object>> profile(Long targetId) {
        User target = userMapper.selectById(targetId);
        if (target == null) {
            throw new BusinessException("用户不存在");
        }

        Long dynamicsCount = dynamicMapper.selectCount(
                new LambdaQueryWrapper<Dynamic>().eq(Dynamic::getUserId, targetId));
        Long followingCount = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowerId, targetId));
        Long fansCount = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowedId, targetId));

        // 我是否已关注对方
        Long meId = UserContext.getUserId();

        // 娃娃数：本人看全量；他人只看 公开娃娃 + 不在私密柜里的娃娃
        Long dollsCount;
        if (meId != null && meId.equals(targetId)) {
            dollsCount = dollMapper.selectCount(
                    new LambdaQueryWrapper<Doll>().eq(Doll::getUserId, targetId));
        } else {
            LambdaQueryWrapper<Doll> qw = new LambdaQueryWrapper<Doll>()
                    .eq(Doll::getUserId, targetId)
                    .eq(Doll::getVisible, 0);
            List<Cabinet> privateCabs = cabinetMapper.selectList(
                    new LambdaQueryWrapper<Cabinet>()
                            .eq(Cabinet::getUserId, targetId)
                            .eq(Cabinet::getVisible, 1));
            if (!privateCabs.isEmpty()) {
                List<Long> privateCabIds = privateCabs.stream().map(Cabinet::getId).toList();
                qw.and(w -> w.notIn(Doll::getCabinetId, privateCabIds).or().isNull(Doll::getCabinetId));
            }
            dollsCount = dollMapper.selectCount(qw);
        }
        boolean isFollowing = false;
        if (meId != null && !meId.equals(targetId)) {
            Long f = followMapper.selectCount(
                    new LambdaQueryWrapper<Follow>()
                            .eq(Follow::getFollowerId, meId)
                            .eq(Follow::getFollowedId, targetId));
            isFollowing = f > 0;
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", target.getId());
        data.put("username", target.getUsername());
        data.put("nickname", target.getNickname());
        data.put("avatar", target.getAvatar());
        data.put("intro", target.getIntro());
        data.put("bgImage", target.getBgImage());
        data.put("role", target.getRole());
        data.put("dynamicsCount", dynamicsCount);
        data.put("dollsCount", dollsCount);
        data.put("followingCount", followingCount);
        data.put("fansCount", fansCount);
        data.put("isFollowing", isFollowing);
        data.put("isMe", meId != null && meId.equals(targetId));
        return Result.success(data);
    }

    /**
     * 获取当前登录用户信息（me）
     */
    public Result<User> getMe() {
        Long userId = UserContext.getUserId();
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        return Result.success(user);
    }

    /**
     * 个人年度统计：今年入的娃娃数、总花费、最贵娃娃、动态数、赞收、粉丝数（娃圈年度报告）
     */
    public Result<Map<String, Object>> myStats() {
        Long meId = UserContext.getUserId();
        LocalDateTime yearStart = LocalDate.now().withDayOfYear(1).atStartOfDay();

        Map<String, Object> yearStats = dollMapper.selectStatsSince(meId, yearStart);
        String mostExpensive = dollMapper.selectMostExpensiveName(meId, yearStart);

        Long yearDynamics = dynamicMapper.selectCount(
                new LambdaQueryWrapper<Dynamic>()
                        .eq(Dynamic::getUserId, meId)
                        .ge(Dynamic::getCreatedAt, yearStart));
        Long yearLikes = favoriteMapper.selectCount(
                new LambdaQueryWrapper<Favorite>()
                        .eq(Favorite::getUserId, meId)
                        .ge(Favorite::getCreatedAt, yearStart));
        Long fans = followMapper.selectCount(
                new LambdaQueryWrapper<Follow>().eq(Follow::getFollowedId, meId));
        Long totalDolls = dollMapper.selectCount(
                new LambdaQueryWrapper<Doll>().eq(Doll::getUserId, meId));

        Map<String, Object> data = new HashMap<>();
        data.put("year", LocalDate.now().getYear());
        data.put("yearDolls", yearStats.get("count"));
        data.put("yearTotal", yearStats.get("total"));
        data.put("yearMaxPrice", yearStats.get("maxPrice"));
        data.put("mostExpensive", mostExpensive);
        data.put("yearDynamics", yearDynamics);
        data.put("yearLikes", yearLikes);
        data.put("fans", fans);
        data.put("totalDolls", totalDolls);
        return Result.success(data);
    }
}
