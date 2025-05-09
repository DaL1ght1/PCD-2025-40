package com.pcd.notificationservice.Exception;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.MessageListenerContainer;
import org.springframework.stereotype.Component;

/**
 * Custom error handler for Kafka message processing
 */
@Component
@Slf4j
public class EmailServiceErrorHandler implements CommonErrorHandler {


    public void handleRecord(
            Exception thrownException,
            ConsumerRecord<?, ?> record,
            Consumer<?, ?> consumer,
            MessageListenerContainer container) {

        log.error("Error processing email message: topic={}, partition={}, offset={}, key={}, value={}",
                record.topic(), record.partition(), record.offset(),
                record.key(), record.value(), thrownException);

        // Here you could implement dead letter queue logic
        // by sending failed messages to another topic
    }

    @Override
    public void handleRemaining(Exception thrownException,
                                java.util.List<ConsumerRecord<?, ?>> records,
                                Consumer<?, ?> consumer,
                                MessageListenerContainer container) {
        log.error("Multiple records failed processing: {}", records.size(), thrownException);
        records.forEach(record ->
                log.error("Failed record: topic={}, partition={}, offset={}",
                        record.topic(), record.partition(), record.offset()));
    }
}

