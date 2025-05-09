package com.pcd.imageanalysis.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcd.imageanalysis.model.AnalysisResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class KafkaNotificationService {
    private static final Logger log = LoggerFactory.getLogger(KafkaNotificationService.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.analysis-completed:analysis-completed-topic}")
    private String analysisCompletedTopic;

    @Autowired
    public KafkaNotificationService(KafkaTemplate<String, Object> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void notifyAnalysisCompleted(AnalysisResult result) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("imageId", result.getImageId());
            event.put("caseNumber", result.getCaseId());
            event.put("analysisResults", result.getDetectionDetails());

            // Extract any detected manipulations from the details - customize as needed
            List<String> detectedManipulations = new ArrayList<>();
            if (Boolean.TRUE.equals(result.getIsFalsified())) {
                Map<String, Object> details = result.getDetectionDetails();
                // Add logic to extract specific manipulation types based on your model output
                detectedManipulations.add("Digital manipulation detected");
            }

            event.put("detectedManipulations", detectedManipulations);

            kafkaTemplate.send(analysisCompletedTopic, result.getImageId(), event);
            log.info("Sent analysis completed notification for image ID: {}", result.getImageId());
        } catch (Exception e) {
            log.error("Failed to send Kafka notification for analysis completion", e);
        }
    }
}