package com.pcd.configurations;


import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;


@Configuration
public class KafkaUserReggistrationTopicConfig {
    @Bean
    public NewTopic userRegTopic() {
        return TopicBuilder
                .name("user-registration-topic")
                .build();
    }
}
