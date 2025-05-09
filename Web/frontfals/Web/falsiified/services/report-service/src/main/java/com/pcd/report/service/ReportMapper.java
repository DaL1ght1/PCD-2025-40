package com.pcd.report.service;

import com.pcd.report.dto.ReportRequest;
import com.pcd.report.dto.ReportResponse;
import com.pcd.report.model.Report;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ReportMapper {

    @Value("${app.api-gateway-url:http://localhost:8222}")
    private String apiGatewayUrl;

    public Report toEntity(ReportRequest request) {
        if (request == null) {
            return null;
        }

        return Report.builder()
                .caseId(request.getCaseId())
                .title(request.getTitle())
                .description(request.getDescription())
                .verdict(request.getVerdict())
                .judicialNotes(request.getJudicialNotes())
                .imageUrls(request.getImageUrls())
                .attachmentIds(request.getAttachmentIds())
                .reportType(request.getReportType())
                .generatedBy(request.getGeneratedBy())
                .build();
    }

    public ReportResponse toResponse(Report report) {
        if (report == null) {
            return null;
        }

        String pdfUrl = null;
        if (report.getId() != null) {
            pdfUrl = apiGatewayUrl + "/api/v1/reports/export/" + report.getId();
        }

        return ReportResponse.builder()
                .id(report.getId())
                .caseId(report.getCaseId())
                .caseNumber(report.getCaseNumber())
                .title(report.getTitle())
                .description(report.getDescription())
                .investigatorId(report.getInvestigatorId())
                .expertId(report.getExpertId())
                .status(report.getStatus())
                .analyses(report.getAnalyses())
                .verdict(report.getVerdict())
                .judicialNotes(report.getJudicialNotes())
                .imageUrls(report.getImageUrls())
                .attachmentIds(report.getAttachmentIds())
                .reportType(report.getReportType())
                .generatedBy(report.getGeneratedBy())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .pdfUrl(pdfUrl)
                .build();
    }

}
