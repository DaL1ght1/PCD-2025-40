package com.pcd.notificationservice.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for handling failed messages by sending them to a dead letter queue
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadLetterService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.application.name:email-service}")
    private String serviceName;

    @Value("${email.dlq.topic:email-dlq}")
    private String dlqTopic;

    /**
     * Send a failed message to the dead letter queue
     *
     * @param originalTopic the original topic the message was from
     * @param failedMessage the message that failed processing
     * @param exception the exception that caused the failure
     */
    public void sendToDeadLetterQueue(String originalTopic, String failedMessage, Exception exception) {
        try {
            Map<String, Object> dlqMessage = new HashMap<>();
            dlqMessage.put("originalTopic", originalTopic);
            dlqMessage.put("originalMessage", failedMessage);
            dlqMessage.put("exception", exception.getMessage());
            dlqMessage.put("timestamp", LocalDateTime.now().toString());
            dlqMessage.put("service", serviceName);

            String dlqPayload = objectMapper.writeValueAsString(dlqMessage);
            kafkaTemplate.send(dlqTopic, dlqPayload);

            log.info("Message sent to dead letter queue: {}", dlqTopic);
        } catch (Exception e) {
            log.error("Failed to send message to dead letter queue: {}", e.getMessage(), e);
        }
    }
}