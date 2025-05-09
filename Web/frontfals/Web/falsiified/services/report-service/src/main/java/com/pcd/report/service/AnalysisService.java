package com.pcd.report.service;

import com.pcd.report.dto.AnalysisDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final RestTemplate restTemplate;

    public AnalysisDto getAnalysis(String analysisId) {
        log.debug("Fetching analysis with ID: {}", analysisId);
        try {
            // Update the service URL to use service discovery
            AnalysisDto analysis = restTemplate.getForObject(
                    "http://imageanalysis-service/api/v1/analysis/" + analysisId,
                    AnalysisDto.class
            );
            return analysis;
        } catch (Exception e) {
            log.error("Error fetching analysis with ID: {}", analysisId, e);
            return null;
        }
    }
}
