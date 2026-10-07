package com.zestora;

import com.zestora.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
@EnableScheduling
public class ZestoraApplication {
    public static void main(String[] args) {
        SpringApplication.run(ZestoraApplication.class, args);
    }
}
