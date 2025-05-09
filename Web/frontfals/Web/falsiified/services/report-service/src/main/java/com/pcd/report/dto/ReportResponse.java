package com.pcd.report.dto;

import com.pcd.report.model.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private String id;

    private String caseId;

    private String caseNumber;

    private String title;

    private String description;

    private String investigatorId;

    private String expertId;

    private String status;

    private List<Map<String, Object>> analyses = new ArrayList<>();

    private String verdict;

    private String judicialNotes;

    private List<String> imageUrls = new ArrayList<>();

    private List<String> attachmentIds = new ArrayList<>();

    private ReportType reportType;

    private String generatedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String pdfUrl;

    private String templateId;
}
