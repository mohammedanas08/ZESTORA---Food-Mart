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
        // Some hosts report the legacy name "Asia/Calcutta", which newer PostgreSQL servers reject at connect time.
        // Only the Windows/legacy alias is rewritten; the offset is unchanged.
        if ("Asia/Calcutta".equals(java.util.TimeZone.getDefault().getID())) {
            java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Kolkata"));
        }
        SpringApplication.run(ZestoraApplication.class, args);
    }
}
