package com.pcd.notificationservice.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Qualifier;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service responsible for sending emails based on Kafka messages
 */
@Service
@Slf4j
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;
    private final EmailMetricsService metricsService;
    private final DeadLetterService deadLetterService;
    private final String senderEmail;
    private final String senderName;

    /**
     * Constructor for dependency injection
     */
    public EmailService(
            JavaMailSender mailSender,
            @Qualifier("emailTemplateEngine") TemplateEngine templateEngine,
            ObjectMapper objectMapper,
            EmailMetricsService metricsService,
            DeadLetterService deadLetterService,
            @Value("${spring.mail.username}") String senderEmail,
            @Value("${spring.mail.name:System}") String senderName) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.objectMapper = objectMapper;
        this.metricsService = metricsService;
        this.deadLetterService = deadLetterService;
        this.senderEmail = senderEmail;
        this.senderName = senderName;
    }

    /**
     * Listens to the user-registration Kafka topic and processes email requests
     *
     * @param message JSON string containing email data
     * @param acknowledgment Kafka acknowledgment to manually acknowledge processing
     */
    @KafkaListener(topics = "user-registration", groupId = "email-service", containerFactory = "kafkaListenerContainerFactory")
    public void processRegistrationEmail(String message, Acknowledgment acknowledgment) {
        try {
            Map<String, String> emailData = objectMapper.readValue(message, Map.class);
            logger.info("Received registration email request for: {}", emailData.get("to"));

            // Process email asynchronously
            CompletableFuture.runAsync(() -> {
                long startTime = System.nanoTime();
                try {
                    sendTemplatedEmail(
                            emailData.get("to"),
                            emailData.get("subject"),
                            "registration-email",
                            Map.of(
                                    "username", emailData.get("username"),
                                    "confirmationUrl", emailData.get("confirmationUrl"),
                                    "activationCode", emailData.get("activationCode")
                            )
                    );
                    metricsService.recordEmailSent();
                    metricsService.recordEmailProcessingTime(System.nanoTime() - startTime);
                    logger.info("Successfully sent registration email to: {}", emailData.get("to"));
                    // Only acknowledge after successful processing
                    acknowledgment.acknowledge();
                } catch (Exception e) {
                    metricsService.recordEmailFailed();
                    logger.error("Failed to send registration email: {}", e.getMessage(), e);
                    // Send to dead letter queue after retry failures
                    deadLetterService.sendToDeadLetterQueue("user-registration", message, e);
                    // Acknowledge the message to prevent further retries in Kafka
                    acknowledgment.acknowledge();
                }
            }).exceptionally(ex -> {
                logger.error("Unexpected error in async processing: {}", ex.getMessage(), ex);
                acknowledgment.acknowledge(); // Make sure we acknowledge even on unexpected errors
                return null;
            });
        } catch (IOException e) {
            logger.error("Error deserializing email data: {}", e.getMessage(), e);
            // Acknowledge bad messages to avoid infinite retry loops
            acknowledgment.acknowledge();
        }
    }

    /**
     * Sends an email using a Thymeleaf template
     *
     * @param to recipient email address
     * @param subject email subject
     * @param templateName name of Thymeleaf template to use
     * @param variables variables to be used in the template
     */
    @Retryable(
            retryFor = {MessagingException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendTemplatedEmail(
            String to,
            String subject,
            String templateName,
            Map<String, Object> variables) throws MessagingException {

        Context context = new Context();
        variables.forEach(context::setVariable);

        String htmlContent = templateEngine.process(templateName, context);
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Sends an HTML email
     *
     * @param to recipient email address
     * @param subject email subject
     * @param htmlContent HTML content of the email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, senderName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error when sending email to {}: {}", to, e.getMessage());
            throw new MessagingException("Failed to send email", e);
        }
    }
}