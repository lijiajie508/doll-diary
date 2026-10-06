package com.dollshare.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web 配置：注册拦截器 + 跨域 + 静态资源映射
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final JwtInterceptor jwtInterceptor;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                // 拦截需要登录的接口
                .addPathPatterns("/api/**")
                // 放行：登录、注册
                .excludePathPatterns("/api/user/login", "/api/user/register");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 允许前端跨域访问（Vite 开发环境）
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 把 /uploads/** 映射到本地上传目录，让图片能通过 URL 访问
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + new File(uploadDir).getAbsolutePath() + "/");
    }
}
