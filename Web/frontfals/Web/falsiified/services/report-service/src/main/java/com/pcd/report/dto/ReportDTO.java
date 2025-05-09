package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private String caseId;
    private String caseNumber;
    private String caseTitle;
    private String investigatorId;
    private String expertId;
    private String status;
    private LocalDateTime createdAt;
    private List<AnalysisDto> analyses;
    private String verdict;
    private String judicialNotes;
}
