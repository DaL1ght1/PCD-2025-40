package com.pcd.report.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcd.report.service.AutoReportGenerationServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalysisCompletedListener {

    private final AutoReportGenerationServiceImpl autoReportGenerationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.analysis-completed}", groupId = "${spring.application.name}")
    public void handleAnalysisCompleted(String message) {
        try {
            log.info("Received analysis completed event: {}", message);
            Map<String, Object> event = objectMapper.readValue(message, Map.class);

            String imageId = (String) event.get("imageId");
            String caseNumber = (String) event.get("caseNumber");
            Map<String, Object> analysisResults = (Map<String, Object>) event.get("analysisResults");
            List<String> detectedManipulations = (List<String>) event.get("detectedManipulations");

            if (imageId != null && caseNumber != null && analysisResults != null) {
                autoReportGenerationService.generateReportFromAnalysisResults(
                        imageId, analysisResults, detectedManipulations, caseNumber);
                log.info("Auto-generated report for image: {}, case: {}", imageId, caseNumber);
            } else {
                log.warn("Incomplete analysis data received, skipping report generation");
            }
        } catch (Exception e) {
            log.error("Error processing analysis completed event", e);
        }
    }
}