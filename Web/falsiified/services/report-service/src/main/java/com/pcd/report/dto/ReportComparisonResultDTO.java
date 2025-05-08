package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportComparisonResultDTO {
    private boolean sameCaseId;
    private boolean sameExpert;
    private List<String> commonFindings;
    private List<String> uniqueFindingsReport1;
    private List<String> uniqueFindingsReport2;
    private boolean sameVerdict;
}