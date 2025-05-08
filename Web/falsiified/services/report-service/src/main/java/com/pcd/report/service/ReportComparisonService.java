package com.pcd.report.service;

import com.pcd.report.dto.ReportComparisonResultDTO;
import com.pcd.report.model.Report;
import com.pcd.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportComparisonService {

    private final ReportRepository reportRepository;

    public ReportComparisonResultDTO compareReports(String reportId1, String reportId2) {
        log.info("Comparing reports: {} and {}", reportId1, reportId2);

        Report report1 = reportRepository.findById(reportId1)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId1));

        Report report2 = reportRepository.findById(reportId2)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId2));

        // Compare basic metadata
        boolean sameCaseId = Objects.equals(report1.getCaseId(), report2.getCaseId());
        boolean sameExpert = Objects.equals(report1.getExpertId(), report2.getExpertId());

        // Compare analyses
        Set<String> uniqueFindings1 = extractFindings(report1);
        Set<String> uniqueFindings2 = extractFindings(report2);

        Set<String> commonFindings = new HashSet<>(uniqueFindings1);
        commonFindings.retainAll(uniqueFindings2);

        uniqueFindings1.removeAll(commonFindings);
        uniqueFindings2.removeAll(commonFindings);

        // Compare verdicts
        boolean sameVerdict = Objects.equals(report1.getVerdict(), report2.getVerdict());

        return ReportComparisonResultDTO.builder()
                .sameCaseId(sameCaseId)
                .sameExpert(sameExpert)
                .commonFindings(new ArrayList<>(commonFindings))
                .uniqueFindingsReport1(new ArrayList<>(uniqueFindings1))
                .uniqueFindingsReport2(new ArrayList<>(uniqueFindings2))
                .sameVerdict(sameVerdict)
                .build();
    }

    private Set<String> extractFindings(Report report) {
        Set<String> findings = new HashSet<>();

        if (report.getAnalyses() != null) {
            for (Map<String, Object> analysis : report.getAnalyses()) {
                if (analysis.containsKey("detectedManipulations")) {
                    Object manipulations = analysis.get("detectedManipulations");
                    if (manipulations instanceof List) {
                        findings.addAll((List<String>) manipulations);
                    }
                }
            }
        }

        return findings;
    }
}