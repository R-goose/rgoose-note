package com.rgoose.note.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Web MVC 配置
 * 1. CORS 跨域放行 /api/**
 * 2. 静态资源映射 /storage/** 到本地存储目录（便于调试访问媒体文件）
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.storage.dir:./storage}")
    private String storageDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 补齐目录分隔符，确保映射到的是一个目录
        String dir = storageDir.endsWith(File.separator) ? storageDir : storageDir + File.separator;
        registry.addResourceHandler("/storage/**")
                .addResourceLocations("file:" + dir);
    }
}
