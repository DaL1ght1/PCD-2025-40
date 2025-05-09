package com.pcd.imageanalysis.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Document(collection = "image_analysis_results")
public class AnalysisResult {

    @Id
    private String id;

    @Indexed
    private String imageId;

    @Indexed
    private String caseId;

    @CreatedDate
    private LocalDateTime date;

    private String analysisStatus;

    private Boolean isFalsified;
    private Double confidenceScore;
    private String analysisType;
    private String analysisVersion;
    private Map<String, Object> detectionDetails = new HashMap<>();
    private String errorMessage;
    private String analyzedBy;
}