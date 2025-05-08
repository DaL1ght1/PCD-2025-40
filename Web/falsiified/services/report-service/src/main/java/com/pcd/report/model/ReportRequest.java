package com.pcd.report.model;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;


@Setter
@Getter
public class ReportRequest {

    // Getters and setters
    @NotBlank(message = "Report title is required")
    private String title;

    private String description;

    @NotNull(message = "Image ID is required")
    private String imageId;

    @NotNull(message = "Expert ID is required")
    private String expertId;

    private String caseNumber;

    private List<String> detectedManipulations;

    private Map<String, Object> analysisResults;

    private List<String> comments;

    private String status;

}
