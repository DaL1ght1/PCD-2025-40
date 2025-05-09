package com.pcd.report.dto;

import com.pcd.report.model.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {

    @NotBlank(message = "Case ID is required")
    private String caseId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private List<String> analysisIds = new ArrayList<>();

    private List<Map<String, Object>> customAnalysisData = new ArrayList<>();

    private String verdict;

    private String judicialNotes;

    private List<String> imageUrls = new ArrayList<>();

    private List<String> attachmentIds = new ArrayList<>();

    @NotNull(message = "Report type is required")
    private ReportType reportType;

    private String generatedBy;

    private String templateId;

}
