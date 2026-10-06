package com.dollshare;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * 娃柜日记 - 启动类
 */
@SpringBootApplication
@MapperScan("com.dollshare.mapper")
public class DollShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(DollShareApplication.class, args);
    }
}
