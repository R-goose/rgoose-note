package com.rgoose.note;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * R-Goose Note 后端服务启动类
 */
@SpringBootApplication
@MapperScan("com.rgoose.note.mapper")
public class RgooseApplication {

    public static void main(String[] args) {
        SpringApplication.run(RgooseApplication.class, args);
    }
}
