package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseStatisticsDTO {
    private long totalCases;
    private long pendingCases;
    private long assignedCases;
    private long inProgressCases;
    private long analysisCompleteCases;
    private long underReviewCases;
    private long completedCases;
    private long rejectedCases;
}
