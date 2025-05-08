package com.pcd.report.service;

import com.pcd.report.dto.AnalysisDto;
import com.pcd.report.dto.ReportRequest;
import com.pcd.report.dto.ReportResponse;
import com.pcd.report.exception.CaseNotFoundException;
import com.pcd.report.exception.ReportNotFoundException;
import com.pcd.report.exception.TemplateNotFoundException;
import com.pcd.report.model.Case;
import com.pcd.report.model.Report;
import com.pcd.report.model.ReportTemplate;
import com.pcd.report.repository.CaseRepository;
import com.pcd.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ReportService {

    private final RestTemplate restTemplate;
    private final CaseRepository caseRepository;
    private final ReportRepository reportRepository;
    private final ReportMapper reportMapper;
    private final PdfGenerationService pdfGenerationService;
    private final TemplateServiceImpl templateService;

    @Value("${service.analysis.url:http://localhost:8081/api/v1/analysis}")
    private String analysisServiceBaseUrl;

    public ReportService(RestTemplate restTemplate, CaseRepository caseRepository, ReportRepository reportRepository, ReportMapper reportMapper, PdfGenerationService pdfGenerationService, TemplateServiceImpl templateService) {
        this.restTemplate = restTemplate;
        this.caseRepository = caseRepository;
        this.reportRepository = reportRepository;
        this.reportMapper = reportMapper;
        this.pdfGenerationService = pdfGenerationService;
        this.templateService = templateService;
    }


    public AnalysisDto getAnalysis(String analysisId) {
        log.debug("Fetching analysis with ID: {}", analysisId);
        try {
            // Update the service URL to use service discovery
            return restTemplate.getForObject(
                    "http://imageanalysis-service/api/v1/analysis/" + analysisId,
                    AnalysisDto.class
            );

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Analysis not found in analysis service for ID: {}", analysisId);
            return null;
        } catch (Exception e) {
            log.error("Error calling analysis service for ID: {}", analysisId, e);
            throw new RuntimeException("Failed to retrieve analysis details from analysis service", e);
        }
    }

    private Map<String, Object> convertAnalysisToMap(AnalysisDto analysis) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", analysis.getId());
        map.put("imageId", analysis.getImageId());
        map.put("analysisType", analysis.getAnalysisType());
        map.put("isFalsified", analysis.isFalsified());
        map.put("confidenceScore", analysis.getConfidenceScore());
        map.put("detailedResults", analysis.getDetailedResults());
        map.put("analysisDate", analysis.getAnalysisDate());
        map.put("analyzedBy", analysis.getAnalyzedBy());
        return map;
    }

    public ReportResponse createReport(ReportRequest request) throws IOException {
        log.info("Creating report for case ID: {}, template ID: {}", request.getCaseId(), request.getTemplateId());

        String templateId = request.getTemplateId();
        if (templateId == null || templateId.isBlank()) {
            throw new IllegalArgumentException("Template ID must be provided");
        }
        ReportTemplate template = templateService.getTemplateById(templateId);
        if (template == null) {
            throw new TemplateNotFoundException("Report template not found with ID: " + templateId);
        }

        Case caseEntity = caseRepository.findById(request.getCaseId())
                .orElseThrow(() -> new CaseNotFoundException("Case not found with ID: " + request.getCaseId()));

        Report report = reportMapper.toEntity(request);

        report.setCaseNumber(caseEntity.getCaseNumber());
        report.setInvestigatorId(caseEntity.getInvestigatorId());
        report.setExpertId(caseEntity.getAssignedExpertId());
        report.setStatus(caseEntity.getStatus().toString());
        report.setTemplateId(templateId);
        report.setCreatedAt(LocalDateTime.now());
        report.setImageUrls(request.getImageUrls());

        List<Map<String, Object>> analysesData = new ArrayList<>();

        if (request.getAnalysisIds() != null && !request.getAnalysisIds().isEmpty()) {
            for (String analysisId : request.getAnalysisIds()) {
                try {
                    AnalysisDto analysis = getAnalysis(analysisId);
                    if (analysis != null) {
                        Map<String, Object> analysisMap = convertAnalysisToMap(analysis);
                        analysesData.add(analysisMap);
                    }
                } catch (Exception e) {
                    log.error("Error fetching or converting analysis with ID: {}", analysisId, e);
                }
            }
        }

        if (request.getCustomAnalysisData() != null && !request.getCustomAnalysisData().isEmpty()) {
            analysesData.addAll(request.getCustomAnalysisData());
        }

        report.setAnalyses(analysesData);

        // Save the report first to generate an ID
        Report savedReport = reportRepository.save(report);
        log.info("Initial report saved with ID: {}", savedReport.getId());

        // Generate PDF using the saved report with ID
        byte[] pdfContent = pdfGenerationService.generatePdfFromTemplate(savedReport, templateId);
        savedReport.setPdfContent(pdfContent);

        // Update the report with PDF content
        savedReport = reportRepository.save(savedReport);
        log.info("Report updated with PDF content, ID: {}", savedReport.getId());

        return reportMapper.toResponse(savedReport);
    }


    public ReportResponse getReport(String reportId) {
        log.info("Fetching report with ID: {}", reportId);

        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ReportNotFoundException("Report not found with ID: " + reportId));

        return reportMapper.toResponse(report);
    }

    public List<ReportResponse> getAutoGenerated(String imageId) {
        log.info("Fetching auto-generated reports with image ID: {}", imageId);

        List<Report> reports = reportRepository.findByImageUrlsContaining(imageId)
                .stream()
                .filter(r -> Objects.equals(r.getGeneratedBy(), "Auto-Generated"))
                .collect(Collectors.toList());

        return reports.stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }


    public List<ReportResponse> getReportsByCase(String caseId) {
        log.info("Fetching reports for case ID: {}", caseId);

        if (!caseRepository.existsById(caseId)) {
            throw new CaseNotFoundException("Case not found with ID: " + caseId);
        }

        List<Report> reports = reportRepository.findByCaseId(caseId);

        return reports.stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }

    public byte[] exportReport(String reportId) throws IOException {
        log.info("Exporting report with ID: {}", reportId);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ReportNotFoundException("Report not found with ID: " + reportId));

        if (report.getPdfContent() != null && report.getPdfContent().length > 0) {
            return report.getPdfContent();
        }

        // Use the template-based PDF generation
        byte[] pdfContent = pdfGenerationService.generatePdfFromTemplate(report,report.getTemplateId());

        report.setPdfContent(pdfContent);
        reportRepository.save(report);
        return pdfContent;
    }

    public List<ReportResponse> getReportsByInvestigator(String investigatorId) {
        log.info("Fetching reports for investigator ID: {}", investigatorId);

        List<Report> reports = reportRepository.findByInvestigatorId(investigatorId);

        return reports.stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReportResponse> getReportsByExpert(String expertId) {
        log.info("Fetching reports by expert ID: {}", expertId);
        List<Report> reports = reportRepository.findByExpertId(expertId);
        return reports.stream()
                .map(reportMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<ReportResponse> getExpertReport(String expertId) {
        List<Report> report = reportRepository.findByExpertId(expertId);
        List<ReportResponse> expertReports = new ArrayList<ReportResponse>();
        for (Report r : report) {
            reportMapper.toResponse(r);
            expertReports.add(reportMapper.toResponse(r));
        }
        return expertReports;

    }
}