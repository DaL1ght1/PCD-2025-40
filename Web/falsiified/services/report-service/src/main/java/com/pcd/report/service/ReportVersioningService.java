package com.pcd.report.service;

import com.pcd.report.dto.ReportResponse;
import com.pcd.report.exception.ReportNotFoundException;
import com.pcd.report.model.Report;
import com.pcd.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportVersioningService {

    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;


    public ReportResponse createNewVersion(String rapportId, String reason) {

        var originalReport =reportRepository.findById(rapportId).orElseThrow(()->new ReportNotFoundException("Cannot find report with id: " + rapportId));
        log.info("Creating new version of report: {}", originalReport.getId());

        // Create a copy of the original report
        Report newVersion = new Report();
        newVersion.setTitle(originalReport.getTitle());
        newVersion.setDescription(originalReport.getDescription());
        newVersion.setCaseId(originalReport.getCaseId());
        newVersion.setCaseNumber(originalReport.getCaseNumber());
        newVersion.setInvestigatorId(originalReport.getInvestigatorId());
        newVersion.setExpertId(originalReport.getExpertId());
        newVersion.setStatus(originalReport.getStatus());
        newVersion.setAnalyses(originalReport.getAnalyses());
        newVersion.setVerdict(originalReport.getVerdict());
        newVersion.setJudicialNotes(originalReport.getJudicialNotes());
        newVersion.setImageUrls(originalReport.getImageUrls());
        newVersion.setAttachmentIds(originalReport.getAttachmentIds());
        newVersion.setReportType(originalReport.getReportType());
        newVersion.setGeneratedBy(originalReport.getGeneratedBy());

        // Set version metadata
        newVersion.setCreatedAt(LocalDateTime.now());
        newVersion.setUpdatedAt(LocalDateTime.now());
        // Save the new version
        reportRepository.save(newVersion);



        return reportMapper.toResponse(newVersion);
    }

    public List<Report> getReportVersions(String caseId) {
        return reportRepository.findByCaseId(caseId);
    }
}