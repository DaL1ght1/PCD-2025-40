package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisDto {
    private String id;
    private String imageId;
    private String analysisType;
    private boolean isFalsified;
    private double confidenceScore;
    private Map<String, Object> detailedResults;
    private LocalDateTime analysisDate;
    private String analyzedBy;

}
