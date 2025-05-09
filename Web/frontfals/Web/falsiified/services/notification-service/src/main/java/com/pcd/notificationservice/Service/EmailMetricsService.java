package com.pcd.notificationservice.Service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Service for monitoring email operations
 */
@Component
@Slf4j
public class EmailMetricsService {

    private final Counter emailSentCounter;
    private final Counter emailFailedCounter;
    private final Timer emailProcessingTimer;

    public EmailMetricsService(MeterRegistry meterRegistry) {
        this.emailSentCounter = Counter.builder("email.sent")
                .description("Number of emails successfully sent")
                .register(meterRegistry);

        this.emailFailedCounter = Counter.builder("email.failed")
                .description("Number of emails that failed to send")
                .register(meterRegistry);

        this.emailProcessingTimer = Timer.builder("email.processing")
                .description("Time taken to process and send emails")
                .register(meterRegistry);
    }

    /**
     * Record a successful email send
     */
    public void recordEmailSent() {
        emailSentCounter.increment();
    }

    /**
     * Record a failed email send
     */
    public void recordEmailFailed() {
        emailFailedCounter.increment();
    }

    /**
     * Time an email processing operation
     */
    public <T> T recordEmailProcessingTime(Supplier<T> processingOperation) {
        return emailProcessingTimer.record(processingOperation);
    }

    /**
     * Record email processing time manually
     */
    public void recordEmailProcessingTime(long timeNanos) {
        emailProcessingTimer.record(timeNanos, TimeUnit.NANOSECONDS);
    }
}