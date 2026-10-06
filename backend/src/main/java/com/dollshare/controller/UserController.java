package com.dollshare.controller;

import com.dollshare.common.BusinessException;
import com.dollshare.common.Result;
import com.dollshare.dto.LoginDTO;
import com.dollshare.dto.RegisterDTO;
import com.dollshare.entity.User;
import com.dollshare.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 用户控制器：登录、注册
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final StringRedisTemplate redisTemplate;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * 登录接口（带 Redis 限流：同一 IP 1 分钟最多 10 次尝试，防爆破）
     * POST /api/user/login
     * Body: {"username":"dollfan","password":"123456"}
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody @Valid LoginDTO dto, HttpServletRequest request) {
        // 登录限流：Redis 计数，超限直接拒绝（Redis 异常自动降级，不影响登录）
        String ip = getClientIp(request);
        try {
            String key = "login:limit:" + ip;
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                redisTemplate.expire(key, 60, TimeUnit.SECONDS);
            }
            if (count != null && count > 10) {
                throw new BusinessException("尝试次数过多，请 1 分钟后再试");
            }
            Result<Map<String, Object>> result = userService.login(dto);
            // 登录成功清空计数，避免下次误限
            if (result.getCode() == 200) {
                redisTemplate.delete(key);
            }
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception ignored) {
            // Redis 不可用时跳过限流，保证登录可用
        }
        return userService.login(dto);
    }

    /**
     * 获取客户端 IP（兼容反向代理）
     */
    private String getClientIp(HttpServletRequest request) {
        try {
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
                ip = request.getRemoteAddr();
            } else {
                ip = ip.split(",")[0].trim();
            }
            return ip == null ? "" : ip;
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * 注册接口（multipart/form-data）
     * 字段：username、password、nickname（可选）、defaultAvatar（可选，默认头像 emoji）、avatarFile（可选，上传的图片）
     */
    @PostMapping("/register")
    public Result<Void> register(@RequestParam String username,
                                 @RequestParam String password,
                                 @RequestParam(required = false) String nickname,
                                 @RequestParam(required = false) String defaultAvatar,
                                 @RequestParam(value = "avatarFile", required = false) MultipartFile avatarFile) {
        // 头像优先级：上传的图片 > 默认头像 emoji > 无头像
        String avatar = null;
        if (avatarFile != null && !avatarFile.isEmpty()) {
            try {
                avatar = saveAvatar(avatarFile);
            } catch (Exception e) {
                return Result.error(500, e.getMessage());
            }
        } else if (defaultAvatar != null && !defaultAvatar.isBlank()) {
            avatar = defaultAvatar.trim();
        }

        RegisterDTO dto = new RegisterDTO();
        dto.setUsername(username);
        dto.setPassword(password);
        dto.setNickname(nickname);
        return userService.register(dto, avatar);
    }

    /**
     * 保存上传的头像图片，返回可访问的相对路径
     */
    private String saveAvatar(MultipartFile file) throws Exception {
        // 校验扩展名，只允许图片
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }
        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new RuntimeException("仅支持 jpg/png/gif/webp 图片");
        }

        // 生成唯一文件名，保存到 uploads/avatars 目录
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        File dir = new File(uploadDir, "avatars").getAbsoluteFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
        file.transferTo(new File(dir, filename));
        return "/uploads/avatars/" + filename;
    }

    /**
     * 更新当前登录用户头像（multipart/form-data）
     * 字段：avatar（可选，默认头像 emoji）、avatarFile（可选，上传的图片）
     * 返回新的头像值（图片路径或 emoji）
     */
    @PutMapping("/avatar")
    public Result<String> updateAvatar(@RequestParam(required = false) String avatar,
                                       @RequestParam(value = "avatarFile", required = false) MultipartFile avatarFile) {
        // 头像优先级：上传的图片 > 默认头像 emoji
        String newAvatar = null;
        if (avatarFile != null && !avatarFile.isEmpty()) {
            try {
                newAvatar = saveAvatar(avatarFile);
            } catch (Exception e) {
                return Result.error(500, e.getMessage());
            }
        } else if (avatar != null && !avatar.isBlank()) {
            newAvatar = avatar.trim();
        }
        return userService.updateAvatar(newAvatar);
    }

    /**
     * 保存背景图，返回可访问的相对路径
     */
    private String saveBgImage(MultipartFile file) throws Exception {
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }
        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new RuntimeException("仅支持 jpg/png/gif/webp 图片");
        }
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        File dir = new File(uploadDir, "bg").getAbsoluteFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
        file.transferTo(new File(dir, filename));
        return "/uploads/bg/" + filename;
    }

    /**
     * 更新个人资料（multipart/form-data）
     * 字段：nickname（可选）、intro（可选）、bgImage（可选，背景图URL/渐变标识）、bgFile（可选，上传的背景图）
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestParam(required = false) String nickname,
                                      @RequestParam(required = false) String intro,
                                      @RequestParam(required = false) String bgImage,
                                      @RequestParam(value = "bgFile", required = false) MultipartFile bgFile) {
        String newBg = null;
        if (bgFile != null && !bgFile.isEmpty()) {
            try {
                newBg = saveBgImage(bgFile);
            } catch (Exception e) {
                return Result.error(500, e.getMessage());
            }
        } else if (bgImage != null) {
            newBg = bgImage.trim();
        }
        return userService.updateProfile(nickname, intro, newBg);
    }

    /**
     * 获取当前登录用户信息
     * GET /api/user/me（需登录）
     */
    @GetMapping("/me")
    public Result<User> getMe() {
        return userService.getMe();
    }

    /**
     * 个人年度统计
     * GET /api/user/stats（需登录）
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> myStats() {
        return userService.myStats();
    }

    /**
     * 用户公开资料（他人主页用）
     * GET /api/user/{id}
     */
    @GetMapping("/{id}")
    public Result<Map<String, Object>> profile(@PathVariable Long id) {
        return userService.profile(id);
    }
}
