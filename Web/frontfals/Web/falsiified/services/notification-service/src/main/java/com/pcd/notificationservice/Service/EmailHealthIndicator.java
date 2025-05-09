package com.pcd.notificationservice.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * Health check component for email service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailHealthIndicator implements HealthIndicator {

    private final JavaMailSender mailSender;

    @Override
    public Health health() {
        try {
            // Cast to JavaMailSenderImpl to access properties
            if (!(mailSender instanceof JavaMailSenderImpl)) {
                return Health.down()
                        .withDetail("error", "JavaMailSender is not an instance of JavaMailSenderImpl")
                        .build();
            }

            JavaMailSenderImpl mailSenderImpl = (JavaMailSenderImpl) mailSender;

            // Test connection to mail server
            Properties props = mailSenderImpl.getJavaMailProperties();
            String host = mailSenderImpl.getHost();

            if (host == null || host.isEmpty()) {
                return Health.down().withDetail("error", "Mail host not configured").build();
            }

            // Additional health check info
            return Health.up()
                    .withDetail("host", host)
                    .withDetail("protocol", props.getProperty("mail.transport.protocol", "unknown"))
                    .build();
        } catch (Exception e) {
            log.warn("Email health check failed: {}", e.getMessage());
            return Health.down().withDetail("error", e.getMessage()).build();
        }
    }
}