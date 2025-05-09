package com.pcd.report.service;

import com.pcd.report.model.Report;
import com.pcd.report.model.ReportTemplate;
import com.pcd.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AutoReportGenerationServiceImpl {

    private final ReportRepository reportRepository;
    private final TemplateServiceImpl templateService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public Report generateReportFromAnalysisResults(String imageId, Map<String, Object> analysisResults,
                                                    List<String> detectedManipulations, String caseNumber) {
        // Use default template
        ReportTemplate defaultTemplate = templateService.getDefaultTemplate();
        return generateReportFromAnalysisResults(imageId, analysisResults, detectedManipulations, caseNumber, defaultTemplate.getId());
    }

    public Report generateReportFromAnalysisResults(String imageId, Map<String, Object> analysisResults,
                                                    List<String> detectedManipulations, String caseNumber,
                                                    String templateId) {
        ReportTemplate template = templateService.getTemplateById(templateId);

        // Create a new report
        Report report = new Report();
        report.setTitle("Image Falsification Analysis Report");
        report.setDescription(generateReportDescription(detectedManipulations));

        // Store the image ID in the imageUrls list
        List<String> imageUrls = new ArrayList<>();
        imageUrls.add(imageId);
        report.setImageUrls(imageUrls);

        report.setCaseNumber(caseNumber);

        // Store the analysis results in the analyses list
        List<Map<String, Object>> analysesList = new ArrayList<>();
        Map<String, Object> analysisMap = new HashMap<>(analysisResults);
        // Add detected manipulations to the analysis map
        analysisMap.put("detectedManipulations", detectedManipulations);
        analysesList.add(analysisMap);
        report.setAnalyses(analysesList);

        report.setStatus("CREATED");
        report.setCreatedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        report.setGeneratedBy("Auto-Generated");

        // Get the template content
        String templateContent = template.getHtmlTemplate();
        if (templateContent == null || templateContent.isEmpty()) {
            templateContent = templateService.getTemplateContent(template);
        }

        // Generate HTML content
        Map<String, Object> templateData = prepareReportDataFromAnalysisResults(imageId, analysisResults, detectedManipulations);
        templateData.put("caseNumber", caseNumber);
        templateData.put("createdAt", report.getCreatedAt().format(DATE_FORMATTER));
        templateData.put("id", "TBD - Will be set after saving");
        templateData.put("status", report.getStatus());
        templateData.put("expertName", "Auto-Generated");
        templateData.put("description", report.getDescription());

        // Save the report
        Report savedReport = reportRepository.save(report);

        // Update the HTML content with the correct ID
        templateData.put("id", savedReport.getId());

        // Generate PDF content if needed
        // This would require implementing PDF generation logic

        return savedReport;
    }

    public String renderReportToHtml(Report report, Map<String, Object> additionalData) {
        // Get the template
        ReportTemplate template = templateService.getDefaultTemplate();

        // Get the template content
        String templateContent = template.getHtmlTemplate();
        if (templateContent == null || templateContent.isEmpty()) {
            templateContent = templateService.getTemplateContent(template);
        }

        // Prepare the data
        Map<String, Object> templateData = new HashMap<>();
        templateData.put("title", report.getTitle());
        templateData.put("description", report.getDescription());
        templateData.put("caseNumber", report.getCaseNumber());
        templateData.put("imageId", report.getImageUrls() != null && !report.getImageUrls().isEmpty() ?
                report.getImageUrls().get(0) : "");
        templateData.put("createdAt", report.getCreatedAt().format(DATE_FORMATTER));
        templateData.put("updatedAt", report.getUpdatedAt().format(DATE_FORMATTER));
        templateData.put("id", report.getId());
        templateData.put("status", report.getStatus());

        // Format detected manipulations
        StringBuilder manipulationsHtml = new StringBuilder();
        List<String> detectedManipulations = extractDetectedManipulations(report);

        if (detectedManipulations != null && !detectedManipulations.isEmpty()) {
            manipulationsHtml.append("<ul>");
            for (String manipulation : detectedManipulations) {
                manipulationsHtml.append("<li class=\"manipulation-found\">").append(manipulation).append("</li>");
            }
            manipulationsHtml.append("</ul>");
        } else {
            manipulationsHtml.append("<p class=\"manipulation-not-found\">No manipulations detected.</p>");
        }
        templateData.put("detectedManipulations", manipulationsHtml.toString());

        // Format analysis results
        StringBuilder analysisResultsHtml = new StringBuilder();
        if (report.getAnalyses() != null && !report.getAnalyses().isEmpty()) {
            analysisResultsHtml.append("<table style=\"width:100%; border-collapse: collapse;\">");
            analysisResultsHtml.append("<tr><th style=\"text-align:left; padding:8px; border:1px solid #ddd;\">Method</th><th style=\"text-align:left; padding:8px; border:1px solid #ddd;\">Result</th></tr>");

            for (Map<String, Object> analysis : report.getAnalyses()) {
                for (Map.Entry<String, Object> entry : analysis.entrySet()) {
                    if (!entry.getKey().equals("detectedManipulations")) {
                        analysisResultsHtml.append("<tr>");
                        analysisResultsHtml.append("<td style=\"padding:8px; border:1px solid #ddd;\">").append(entry.getKey()).append("</td>");
                        analysisResultsHtml.append("<td style=\"padding:8px; border:1px solid #ddd;\">").append(entry.getValue()).append("</td>");
                        analysisResultsHtml.append("</tr>");
                    }
                }
            }

            analysisResultsHtml.append("</table>");
        } else {
            analysisResultsHtml.append("<p>No detailed analysis results available.</p>");
        }
        templateData.put("analysisResults", analysisResultsHtml.toString());

        // Add conclusion based on detected manipulations
        String conclusion = (detectedManipulations != null && !detectedManipulations.isEmpty())
                ? "<span class=\"manipulation-found\">Image appears to be falsified.</span>"
                : "<span class=\"manipulation-not-found\">No evidence of falsification detected.</span>";
        templateData.put("conclusion", conclusion);

        // Add any additional data
        if (additionalData != null) {
            templateData.putAll(additionalData);
        }

        // Process the template
        return templateService.processTemplate(templateContent, templateData);
    }

    // Helper method to extract detected manipulations from the report
    private List<String> extractDetectedManipulations(Report report) {
        if (report.getAnalyses() != null && !report.getAnalyses().isEmpty()) {
            for (Map<String, Object> analysis : report.getAnalyses()) {
                if (analysis.containsKey("detectedManipulations")) {
                    Object manipulations = analysis.get("detectedManipulations");
                    if (manipulations instanceof List) {
                        return (List<String>) manipulations;
                    }
                }
            }
        }
        return new ArrayList<>();
    }

    private String generateReportDescription(List<String> detectedManipulations) {
        if (detectedManipulations == null || detectedManipulations.isEmpty()) {
            return "Automated image analysis detected no evidence of falsification.";
        } else {
            return "Automated image analysis detected potential falsification. " +
                    "Found " + detectedManipulations.size() + " suspect manipulation(s).";
        }
    }

    public Map<String, Object> prepareReportDataFromAnalysisResults(String imageId, Map<String, Object> analysisResults,
                                                                    List<String> detectedManipulations) {
        Map<String, Object> data = new HashMap<>();

        // Basic data
        data.put("imageId", imageId);
        data.put("title", "Image Falsification Analysis Report");
        data.put("imageUrl", "/api/images/" + imageId); // Assuming this is the URL pattern to view the image

        // Format detected manipulations
        StringBuilder manipulationsHtml = new StringBuilder();
        if (detectedManipulations != null && !detectedManipulations.isEmpty()) {
            manipulationsHtml.append("<ul>");
            for (String manipulation : detectedManipulations) {
                manipulationsHtml.append("<li class=\"manipulation-found\">").append(manipulation).append("</li>");
            }
            manipulationsHtml.append("</ul>");
        } else {
            manipulationsHtml.append("<p class=\"manipulation-not-found\">No manipulations detected.</p>");
        }
        data.put("detectedManipulations", manipulationsHtml.toString());

        // Format analysis results
        StringBuilder analysisResultsHtml = new StringBuilder();
        if (analysisResults != null && !analysisResults.isEmpty()) {
            analysisResultsHtml.append("<table style=\"width:100%; border-collapse: collapse;\">");
            analysisResultsHtml.append("<tr><th style=\"text-align:left; padding:8px; border:1px solid #ddd;\">Method</th><th style=\"text-align:left; padding:8px; border:1px solid #ddd;\">Result</th></tr>");

            for (Map.Entry<String, Object> entry : analysisResults.entrySet()) {
                analysisResultsHtml.append("<tr>");
                analysisResultsHtml.append("<td style=\"padding:8px; border:1px solid #ddd;\">").append(entry.getKey()).append("</td>");
                analysisResultsHtml.append("<td style=\"padding:8px; border:1px solid #ddd;\">").append(entry.getValue()).append("</td>");
                analysisResultsHtml.append("</tr>");
            }

            analysisResultsHtml.append("</table>");
        } else {
            analysisResultsHtml.append("<p>No detailed analysis results available.</p>");
        }
        data.put("analysisResults", analysisResultsHtml.toString());

        // Add conclusion based on detected manipulations
        String conclusion = (detectedManipulations != null && !detectedManipulations.isEmpty())
                ? "<span class=\"manipulation-found\">Image appears to be falsified.</span>"
                : "<span class=\"manipulation-not-found\">No evidence of falsification detected.</span>";
        data.put("conclusion", conclusion);

        return data;
    }
}