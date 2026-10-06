package com.dollshare.controller;

import com.dollshare.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 文件上传控制器
 * 图片上传后保存到本地 uploads 目录，返回可访问的 URL
 */
@RestController
@RequestMapping("/api")
public class UploadController {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * 上传图片
     * POST /api/upload，表单字段名 file
     */
    @PostMapping("/upload")
    public Result<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            return Result.error(500, "文件不能为空");
        }

        // 校验扩展名，只允许图片
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf(".")).toLowerCase();
        }
        if (!ext.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            return Result.error(500, "仅支持 jpg/png/gif/webp 图片");
        }

        // 生成唯一文件名，避免重名覆盖
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;

        // 保存到 uploads 目录
        // 关键：必须用绝对路径。相对路径 ./uploads 会被 transferTo 解析到 Tomcat 临时目录而报错
        File dir = new File(uploadDir).getAbsoluteFile();
        if (!dir.exists()) {
            dir.mkdirs();
        }
        file.transferTo(new File(dir, filename));

        // 返回可访问的相对路径（前端 vite 代理 /uploads → 8081）
        String url = "/uploads/" + filename;
        Map<String, Object> data = new HashMap<>();
        data.put("url", url);
        return Result.success(data);
    }
}
