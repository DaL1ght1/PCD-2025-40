package com.pcd.report.service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.draw.LineSeparator;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import com.pcd.report.model.Report;
import com.pcd.report.model.ReportTemplate;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateInputException;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PdfGenerationService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String DEFAULT_TEMPLATES_DIR = "src/main/resources/templates/";
    private final TemplateServiceImpl templateService;
    private final TemplateEngine templateEngine;
    private final ResourceLoader resourceLoader;
    private final RestTemplate restTemplate;
    @Value("${templates.directory:}")
    private String templatesDir;
    @Value("${image-management-service.url:http://imageManagement-service:8050}")
    private String imageManagementServiceUrl;
    @Value("${image-analysis-service.url}")
    private String imageAnalysisServiceUrl;

    public PdfGenerationService(
            TemplateServiceImpl templateService,
            TemplateEngine templateEngine,
            @Qualifier("webApplicationContext") ResourceLoader resourceLoader,
            RestTemplate restTemplate) {
        this.templateService = templateService;
        this.templateEngine = templateEngine;
        this.resourceLoader = resourceLoader;
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    private void initializeTemplatesDirectory() {
        String TEMPLATES_DIR = (templatesDir == null || templatesDir.trim().isEmpty())
                ? DEFAULT_TEMPLATES_DIR
                : templatesDir.endsWith("/") ? templatesDir : templatesDir + "/";

        try {
            Path templatesPath = Paths.get(TEMPLATES_DIR);
            if (!Files.exists(templatesPath)) {
                Files.createDirectories(templatesPath);
                log.info("Created templates directory: {}", templatesPath.toAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Failed to create templates directory: {}", TEMPLATES_DIR, e);
        }
    }

    public byte[] generatePdfFromTemplate(Report report, String templateId) throws IOException {
        log.info("Generating PDF from template for report: {}", report.getId());

        ReportTemplate template;
        if (templateId == null) {
            log.warn("Template ID is null for report {}, falling back to default template", report.getId());
            template = templateService.getDefaultTemplate();
        } else {
            try {
                template = templateService.getTemplateById(templateId);
            } catch (Exception e) {
                log.warn("Template not found for ID {}, falling back to default template", templateId, e);
                template = templateService.getDefaultTemplate();
            }
        }

        if (template == null) {
            log.warn("No default template found, falling back to hardcoded template");
            return generateExpertPdf(report);
        }

        String templateFilePath = template.getFilePath();
        if (templateFilePath == null || templateFilePath.trim().isEmpty()) {
            log.warn("LocalFilePath is null or empty for template {}, falling back to expert PDF", template.getId());
            return generateExpertPdf(report);
        }

        String templateFinalDir = templatesDir + "/" + templateFilePath;
        Path templatePath = Paths.get(templateFinalDir);
        if (!Files.exists(templatePath)) {
            log.warn("Template file does not exist at path: {}. Falling back to expert PDF", templateFinalDir);
            return generateExpertPdf(report);
        }

        try {
            // Prepare report data including images
            Map<String, Object> reportData = prepareReportData(report);

            // Generate PDF directly with embedded images
            return generatePdfWithImages(template, templatePath, reportData);

        } catch (Exception e) {
            log.error("Error generating PDF from template for report: {}", report.getId(), e);
            return generateExpertPdf(report);
        }
    }

    private byte[] generatePdfWithImages(ReportTemplate template, Path templatePath, Map<String, Object> reportData) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            // Create document with slightly larger margins to ensure images fit properly
            Document document = new Document(PageSize.A4, 50, 50, 70, 50); // Left, right, top, bottom margins
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            // Add custom event handler to fix potential rendering issues
            writer.setStrictImageSequence(true);

            document.open();

            // Process the HTML template
            String templateContent;
            try {
                templateContent = Files.readString(templatePath, StandardCharsets.UTF_8);
            } catch (IOException e) {
                log.error("Failed to read template file from: {}", templatePath, e);
                throw new RuntimeException("Failed to read template file", e);
            }

            String processedHtml;
            try {
                log.info("Processing template from: {}", templatePath);
                processedHtml = templateService.processTemplate(templateContent, reportData);
            } catch (TemplateInputException e) {
                log.warn("Failed to process template content, falling back to direct content processing", e);
                if (template.getHtmlTemplate() != null && !template.getHtmlTemplate().isEmpty()) {
                    processedHtml = templateService.processTemplate(template.getHtmlTemplate(), reportData);
                } else {
                    log.error("No valid template content available for template: {}", template.getId());
                    throw new RuntimeException("Failed to process template: no valid content available", e);
                }
            }

            // Parse and render the HTML content
            try {
                // Create a more controlled HTML parser configuration
                InputStream htmlStream = new ByteArrayInputStream(processedHtml.getBytes(StandardCharsets.UTF_8));
                XMLWorkerHelper helper = XMLWorkerHelper.getInstance();

                // Use the parseXHtml method with explicit charset
                helper.parseXHtml(writer, document, htmlStream, null, StandardCharsets.UTF_8);

                log.debug("HTML content successfully parsed and added to document");
            } catch (Exception e) {
                log.error("Error parsing HTML content", e);
                document.add(new Paragraph("Error rendering template: " + e.getMessage(),
                        new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC, BaseColor.RED)));

                // Continue with the rest of the document despite HTML parsing error
                document.add(new Paragraph("\n\nContinuing with basic report format...\n\n"));

                // Add basic content from report data as fallback
                addBasicContentToDocument(document, reportData);
            }

            // Add images directly to the document in a separate step
            // Start a new page to ensure images don't overlap with HTML content
            document.newPage();
            addImagesToDocumentAfterHtml(document, reportData);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF with images", e);
            throw new RuntimeException("Failed to generate PDF with images", e);
        }
    }

    // Helper method to add basic content when HTML processing fails
    private void addBasicContentToDocument(Document document, Map<String, Object> reportData) throws DocumentException {
        // Add title
        String title = (String) reportData.getOrDefault("title", "Report");
        Paragraph titlePara = new Paragraph(title, new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD));
        titlePara.setAlignment(Element.ALIGN_CENTER);
        document.add(titlePara);
        document.add(Chunk.NEWLINE);

        // Add basic metadata
        document.add(new Paragraph("Report ID: " + reportData.getOrDefault("id", "N/A")));
        document.add(new Paragraph("Case Number: " + reportData.getOrDefault("caseNumber", "N/A")));
        document.add(new Paragraph("Created At: " + reportData.getOrDefault("createdAt", "N/A")));
        document.add(new Paragraph("Status: " + reportData.getOrDefault("status", "N/A")));
        document.add(Chunk.NEWLINE);

        // Add description if available
        String description = (String) reportData.getOrDefault("description", null);
        if (description != null && !description.isEmpty()) {
            document.add(new Paragraph("Description:", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
            document.add(new Paragraph(description));
            document.add(Chunk.NEWLINE);
        }

        // Add conclusion if available
        String conclusion = (String) reportData.getOrDefault("conclusion", null);
        if (conclusion != null && !conclusion.isEmpty()) {
            document.add(new Paragraph("Conclusion:", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
            document.add(new Paragraph(conclusion));
            document.add(Chunk.NEWLINE);
        }
    }

    // Updated method to add original and XAI visualization images
    private void addImagesToDocumentAfterHtml(Document document, Map<String, Object> reportData) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> analysesWithImages = (List<Map<String, Object>>) reportData.get("analysesWithImages");

            if (analysesWithImages == null || analysesWithImages.isEmpty()) {
                log.warn("No analyses with images to add to the PDF");
                document.add(new Paragraph("No image evidence available",
                        new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC)));
                return;
            }

            log.info("Adding {} analyses with images to PDF document", analysesWithImages.size());

            // Add a section header for images
            document.add(new Paragraph("\n"));
            Paragraph imagesHeader = new Paragraph("Image Evidence and Analysis Visualizations",
                    new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD));
            imagesHeader.setAlignment(Element.ALIGN_CENTER);
            document.add(imagesHeader);
            document.add(new Paragraph("\n"));

            for (Map<String, Object> analysis : analysesWithImages) {
                String analysisId = String.valueOf(analysis.get("id"));
                String imageId = String.valueOf(analysis.get("imageId"));
                log.debug("Processing images for analysis ID: {} with image ID: {}", analysisId, imageId);

                // Create a section for this analysis
                Paragraph analysisHeader = new Paragraph("Analysis ID: " + analysisId,
                        new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD));
                analysisHeader.setSpacingBefore(10);
                document.add(analysisHeader);

                // Add original image
                byte[] imageData = (byte[]) analysis.get("imageData");
                if (imageData == null || imageData.length == 0) {
                    log.warn("No valid image data for image ID: {}", imageId);
                    document.add(new Paragraph("Original image not available for Analysis ID: " + analysisId,
                            new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC)));
                } else {
                    addImageToDocument(document, imageData, "Original Image", analysisId, imageId, analysis);
                }

                // Add XAI visualization images (Grad-CAM, LIME, SHAP)
                String[] visualizationTypes = {"gradcam", "lime", "shap"};
                for (String vizType : visualizationTypes) {
                    byte[] vizImageData = (byte[]) analysis.get(vizType + "ImageData");
                    if (vizImageData == null || vizImageData.length == 0) {
                        log.warn("No valid {} image data for analysis ID: {}", vizType, analysisId);
                        document.add(new Paragraph(vizType.toUpperCase() + " visualization not available",
                                new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC)));
                    } else {
                        addImageToDocument(document, vizImageData, vizType.toUpperCase() + " Visualization",
                                analysisId, imageId, analysis);
                    }
                }

                // Add a separator
                document.add(new Paragraph("\n"));
                LineSeparator separator = new LineSeparator();
                document.add(new Chunk(separator));
                document.add(new Paragraph("\n"));
            }
        } catch (Exception e) {
            log.error("Error in addImagesToDocumentAfterHtml", e);
            try {
                document.add(new Paragraph("Error adding images: " + e.getMessage(),
                        new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD, BaseColor.RED)));
            } catch (DocumentException de) {
                log.error("Could not add error message to document", de);
            }
        }
    }

    // Helper method to add a single image to the document
    private void addImageToDocument(Document document, byte[] imageData, String label, String analysisId,
                                    String imageId, Map<String, Object> analysis) throws DocumentException {
        try {
            com.itextpdf.text.Image pdfImage = com.itextpdf.text.Image.getInstance(imageData);
            float originalWidth = pdfImage.getWidth();
            float originalHeight = pdfImage.getHeight();
            log.debug("Image '{}' dimensions: {}x{}", label, originalWidth, originalHeight);

            // Calculate available width on page
            float pageWidth = document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin();
            float maxWidth = pageWidth - 40; // Add some margin

            // Calculate scale to fit width while maintaining aspect ratio
            float scaleFactor = Math.min(1.0f, maxWidth / originalWidth);
            pdfImage.scaleAbsolute(originalWidth * scaleFactor, originalHeight * scaleFactor);

            // Check if there's enough space on the current page
            float imageHeight = pdfImage.getScaledHeight();
            float yPos = document.getPageSize().getHeight() - document.topMargin() - 100;
            if (yPos - imageHeight < document.bottomMargin() + 50) {
                document.newPage();
            }

            // Add image label
            Paragraph imageLabel = new Paragraph(label, new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD));
            imageLabel.setAlignment(Element.ALIGN_CENTER);
            document.add(imageLabel);

            // Add the image
            pdfImage.setAlignment(Element.ALIGN_CENTER);
            document.add(pdfImage);

            // Add image details below the image
            Font detailsFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
            Paragraph details = new Paragraph();
            details.setAlignment(Element.ALIGN_CENTER);
            details.add(new Chunk("Image ID: " + imageId + " | ", detailsFont));

            Boolean isFalsified = (Boolean) analysis.get("isFalsified");
            if (isFalsified != null) {
                Font statusFont = new Font(
                        Font.FontFamily.HELVETICA,
                        10,
                        Font.BOLD,
                        isFalsified ? BaseColor.RED : new BaseColor(46, 204, 113));
                details.add(new Chunk("Status: " + (isFalsified ? "MANIPULATED" : "AUTHENTIC"), statusFont));
            } else {
                details.add(new Chunk("Status: Unknown", detailsFont));
            }

            document.add(details);

            Object confidenceScore = analysis.get("confidenceScore");
            if (confidenceScore != null) {
                Paragraph confidence = new Paragraph("Confidence Score: " + confidenceScore + "%",
                        new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC));
                confidence.setAlignment(Element.ALIGN_CENTER);
                document.add(confidence);
            }

            log.info("Successfully added '{}' for analysis ID: {}", label, analysisId);
        } catch (Exception e) {
            log.error("Error adding '{}' for analysis ID: {}", label, analysisId, e);
            document.add(new Paragraph("Error adding " + label + ": " + e.getMessage(),
                    new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC, BaseColor.RED)));
        }
    }

    private Map<String, Object> prepareReportData(Report report) {
        Map<String, Object> reportData = new HashMap<>();
        reportData.put("id", report.getId());
        reportData.put("title", report.getTitle());
        reportData.put("caseNumber", report.getCaseNumber());
        reportData.put("caseId", report.getCaseId());
        reportData.put("status", report.getStatus());
        reportData.put("reportType", report.getReportType());
        reportData.put("createdAt", report.getCreatedAt() != null ? report.getCreatedAt().format(DATE_FORMATTER) : "N/A");
        reportData.put("description", report.getDescription());
        reportData.put("analyses", report.getAnalyses());
        reportData.put("conclusion", report.getVerdict());
        reportData.put("judicialNotes", report.getJudicialNotes());
        reportData.put("generatedBy", report.getGeneratedBy());
        reportData.put("investigatorId", report.getInvestigatorId());
        reportData.put("expertId", report.getExpertId());
        reportData.put("imageUrls", report.getImageUrls());
        reportData.put("expertName", report.getExpertId() != null ? report.getExpertId() : "N/A");
        reportData.put("detectedManipulations", report.getAnalyses() != null ? report.getAnalyses().toString() : "No manipulation data available");
        reportData.put("analysisResults", report.getAnalyses() != null ? report.getAnalyses().toString() : "No analysis results available");
        reportData.put("comments", report.getJudicialNotes() != null ? report.getJudicialNotes() : "No comments available");

        // Prepare analyses with associated images
        List<Map<String, Object>> analysesWithImages = new ArrayList<>();

        // Extract image IDs from URLs
        List<String> imageUrls = report.getImageUrls();
        log.debug("Image URLs in report: {}", imageUrls);
        List<String> imageIds = imageUrls != null
                ? imageUrls.stream()
                .map(url -> {
                    if (url == null || url.isEmpty()) {
                        return null;
                    }

                    String[] parts = url.split("/");
                    String imageId = null;

                    // Look for the pattern /images/{imageId}/download
                    for (int i = 0; i < parts.length - 1; i++) {
                        if ("images".equals(parts[i]) && i+1 < parts.length &&
                                parts.length > i+2 && "download".equals(parts[i+2])) {
                            imageId = parts[i+1];
                            break;
                        }
                    }

                    // Fallback: look for /download after any segment
                    if (imageId == null) {
                        for (int i = 0; i < parts.length - 1; i++) {
                            if ("download".equals(parts[i + 1])) {
                                imageId = parts[i];
                                break;
                            }
                        }
                    }

                    // Last resort: if we're dealing with a very specific format
                    if (imageId == null && parts.length >= 6) {
                        imageId = parts[5]; // Assuming format /api/v1/images/{imageId}/download
                    }

                    log.debug("Extracted image ID: {} from URL: {}", imageId, url);
                    return imageId;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList())
                : Collections.emptyList();

        log.debug("Extracted image IDs: {}", imageIds);
        if (imageIds.isEmpty()) {
            log.warn("No image IDs extracted for report: {}", report.getId());
        }

        // Fetch analyses from ImageAnalysisService if not populated
        List<Map<String, Object>> analyses = report.getAnalyses();
        log.debug("Analyses from report: {}", analyses);
        if (analyses == null || analyses.isEmpty()) {
            log.info("Analyses not populated in report, fetching from ImageAnalysisService for report: {}", report.getId());
            if (!imageIds.isEmpty()) {
                try {
                    String analysisUrl = imageAnalysisServiceUrl + "/api/analyses/by-image-ids";
                    log.debug("Fetching analyses from URL: {} with image IDs: {}", analysisUrl, imageIds);
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    HttpEntity<List<String>> requestEntity = new HttpEntity<>(imageIds, headers);
                    ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                            analysisUrl,
                            HttpMethod.POST,
                            requestEntity,
                            new ParameterizedTypeReference<List<Map<String, Object>>>() {}
                    );

                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        analyses = response.getBody();
                        log.info("Successfully fetched {} analyses from ImageAnalysisService for report: {}", analyses.size(), report.getId());
                        log.debug("Fetched analyses: {}", analyses);
                    } else {
                        log.warn("Failed to fetch analyses for image IDs: {}. Status: {}", imageIds, response.getStatusCode());
                        analyses = Collections.emptyList();
                    }
                } catch (Exception e) {
                    log.error("Error fetching analyses from ImageAnalysisService for report: {}", report.getId(), e);
                    analyses = Collections.emptyList();
                }
            } else {
                log.warn("No image IDs available to fetch analyses for report: {}", report.getId());
                analyses = Collections.emptyList();
            }
        } else {
            log.info("Using pre-populated analyses from report: {} analyses found", analyses.size());
        }

        // Process analyses and fetch image content
        if (!analyses.isEmpty()) {
            Map<String, Map<String, Object>> analysisMap = analyses.stream()
                    .filter(analysis -> analysis.get("imageId") != null)
                    .collect(Collectors.toMap(
                            analysis -> String.valueOf(analysis.get("imageId")),
                            analysis -> analysis,
                            (a1, a2) -> {
                                log.warn("Duplicate imageId found: {}. Keeping first analysis: {}", a1.get("imageId"), a1);
                                return a1;
                            }
                    ));
            log.debug("Analysis map created with {} entries: {}", analysisMap.size(), analysisMap.keySet());

            for (String imageId : imageIds) {
                if (imageId == null || imageId.isEmpty()) {
                    log.warn("Skipping null or empty imageId");
                    continue;
                }

                Map<String, Object> analysis = analysisMap.get(imageId);
                if (analysis == null) {
                    log.info("No analysis found for image ID: {}. Creating minimal analysis entry.", imageId);
                    analysis = new HashMap<>();
                    analysis.put("id", "N/A");
                    analysis.put("imageId", imageId);
                    analysis.put("analysisStatus", "Not Analyzed");
                    analysis.put("isFalsified", null);
                    analysis.put("confidenceScore", null);
                    analysis.put("analysisType", "N/A");
                    analysis.put("analyzedBy", "N/A");
                    analysis.put("errorMessage", "No analysis available");
                    analysis.put("detectionDetails", Collections.emptyMap());
                } else {
                    log.debug("Found analysis for image ID: {}: {}", imageId, analysis);
                }

                Map<String, Object> analysisData = new HashMap<>(analysis);

                // Fetch original image
                byte[] imageData = fetchImageWithRetry(imageId, 3);
                if (imageData != null && imageData.length > 0) {
                    try {
                        com.itextpdf.text.Image testImage = com.itextpdf.text.Image.getInstance(imageData);
                        if (testImage != null && testImage.getWidth() > 0 && testImage.getHeight() > 0) {
                            log.info("Successfully validated original image data for image ID: {}", imageId);
                            analysisData.put("imageData", imageData);
                        } else {
                            log.warn("Invalid original image data for image ID: {}", imageId);
                        }
                    } catch (Exception e) {
                        log.error("Invalid original image data for image ID: {}", imageId, e);
                    }
                } else {
                    log.warn("No original image data retrieved for image ID: {}", imageId);
                }

                // Fetch XAI visualization images (Grad-CAM, LIME, SHAP)
                String analysisId = String.valueOf(analysis.get("id"));
                if (!analysisId.equals("N/A")) {
                    String[] visualizationTypes = {"gradcam", "lime", "shap"};
                    for (String vizType : visualizationTypes) {
                        byte[] vizImageData = fetchVisualizationImage(analysisId, vizType);
                        if (vizImageData != null && vizImageData.length > 0) {
                            try {
                                com.itextpdf.text.Image testImage = com.itextpdf.text.Image.getInstance(vizImageData);
                                if (testImage != null && testImage.getWidth() > 0 && testImage.getHeight() > 0) {
                                    log.info("Successfully validated {} image data for analysis ID: {}", vizType, analysisId);
                                    analysisData.put(vizType + "ImageData", vizImageData);
                                } else {
                                    log.warn("Invalid {} image data for analysis ID: {}", vizType, analysisId);
                                }
                            } catch (Exception e) {
                                log.error("Invalid {} image data for analysis ID: {}", vizType, analysisId, e);
                            }
                        } else {
                            log.warn("No {} image data retrieved for analysis ID: {}", vizType, analysisId);
                        }
                    }
                }

                // Only add to analysesWithImages if at least one image is present
                if (analysisData.containsKey("imageData") ||
                        analysisData.containsKey("gradcamImageData") ||
                        analysisData.containsKey("limeImageData") ||
                        analysisData.containsKey("shapImageData")) {
                    analysesWithImages.add(analysisData);
                    log.debug("Added analysis data to analysesWithImages for ID: {}", analysisData.get("id"));
                } else {
                    log.warn("No valid images for analysis ID: {}, skipping", analysisId);
                }
            }
        } else {
            log.warn("No analyses available to process for report: {}", report.getId());
        }

        log.debug("Final analysesWithImages list size: {}", analysesWithImages.size());
        reportData.put("analysesWithImages", analysesWithImages);
        return reportData;
    }

    // New method to fetch XAI visualization images
    private byte[] fetchVisualizationImage(String analysisId, String visualizationType) {
        String baseUrl = imageAnalysisServiceUrl.endsWith("/")
                ? imageAnalysisServiceUrl.substring(0, imageAnalysisServiceUrl.length() - 1)
                : imageAnalysisServiceUrl;
        String vizUrl = baseUrl + "/api/v1/analysis/" + analysisId + "/xai-visualization/" + visualizationType;
        vizUrl += "?userId=PDF_SERVICE&userRole=SYSTEM&reason=PDFGeneration";

        log.info("Attempting to fetch {} visualization for analysis ID: {}", visualizationType, analysisId);
        return fetchImageWithRetry(vizUrl, 3); // Reuse existing retry logic
    }

    // Modified to accept URL for reuse with visualization images
    private byte[] fetchImageWithRetry(String urlOrImageId, int maxRetries) {
        String fetchUrl;
        if (urlOrImageId.startsWith("http")) {
            fetchUrl = urlOrImageId;
        } else {
            String baseUrl = imageManagementServiceUrl.endsWith("/")
                    ? imageManagementServiceUrl.substring(0, imageManagementServiceUrl.length() - 1)
                    : imageManagementServiceUrl;
            fetchUrl = baseUrl + "/api/v1/images/" + urlOrImageId + "/download?userId=PDF_SERVICE&userRole=SYSTEM&reason=PDFGeneration";
        }

        int retries = 0;
        List<String> errorMessages = new ArrayList<>();

        while (retries < maxRetries) {
            try {
                log.info("Fetching image from URL: {} (attempt {}/{})", fetchUrl, retries + 1, maxRetries);
                HttpHeaders headers = new HttpHeaders();
                headers.setCacheControl(CacheControl.noCache());
                headers.setPragma("no-cache");
                headers.setAccept(Arrays.asList(MediaType.IMAGE_JPEG, MediaType.IMAGE_PNG, MediaType.APPLICATION_OCTET_STREAM));
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<byte[]> imageResponse = restTemplate.exchange(
                        fetchUrl,
                        HttpMethod.GET,
                        entity,
                        byte[].class
                );

                if (imageResponse.getStatusCode().is2xxSuccessful() && imageResponse.getBody() != null) {
                    byte[] imageData = imageResponse.getBody();
                    if (imageData.length > 0 && isValidImageData(imageData)) {
                        log.info("Successfully fetched valid image from URL: {}. Size: {} bytes", fetchUrl, imageData.length);
                        return imageData;
                    } else {
                        String errorMsg = "Retrieved data from URL: " + fetchUrl + " is not a valid image";
                        log.warn(errorMsg);
                        errorMessages.add(errorMsg);
                    }
                } else {
                    String errorMsg = "Failed to fetch image from URL: " + fetchUrl + ". Status: " + imageResponse.getStatusCode();
                    log.warn(errorMsg);
                    errorMessages.add(errorMsg);
                }
            } catch (Exception e) {
                String errorMsg = "Error fetching image from URL: " + fetchUrl + " (attempt " + (retries + 1) + "/" + maxRetries + "): " + e.getMessage();
                log.error(errorMsg, e);
                errorMessages.add(errorMsg);
            }

            retries++;
            if (retries < maxRetries) {
                try {
                    long backoffTime = 1000L * (long) Math.pow(2, retries - 1);
                    log.info("Retrying in {} ms...", backoffTime);
                    Thread.sleep(backoffTime);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    log.warn("Sleep interrupted during retry delay");
                }
            }
        }

        log.error("Failed to fetch image after {} attempts from URL: {}. Errors: {}", maxRetries, fetchUrl, String.join("; ", errorMessages));
        return null;
    }

    private boolean isValidImageData(byte[] data) {
        if (data == null || data.length < 8) {
            log.warn("Image data is null or too small to be a valid image (length: {})",
                    data != null ? data.length : "null");
            return false;
        }

        try {
            com.itextpdf.text.Image.getInstance(data);
            return true;
        } catch (Exception e) {
            log.debug("Failed to validate image data with iText: {}", e.getMessage());
        }

        // Check for JPEG header (SOI marker)
        if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) {
            log.debug("Image data appears to be JPEG based on header");
            return true;
        }

        // Check for PNG signature
        if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50 &&
                data[2] == (byte) 0x4E && data[3] == (byte) 0x47 &&
                data[4] == (byte) 0x0D && data[5] == (byte) 0x0A &&
                data[6] == (byte) 0x1A && data[7] == (byte) 0x0A) {
            log.debug("Image data appears to be PNG based on header");
            return true;
        }

        // Check for GIF header ("GIF87a" or "GIF89a")
        if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49 && data[2] == (byte) 0x46 &&
                data[3] == (byte) 0x38 && (data[4] == (byte) 0x37 || data[4] == (byte) 0x39) &&
                data[5] == (byte) 0x61) {
            log.debug("Image data appears to be GIF based on header");
            return true;
        }

        // Check for BMP header
        if (data[0] == (byte) 0x42 && data[1] == (byte) 0x4D) {
            log.debug("Image data appears to be BMP based on header");
            return true;
        }

        // Check for WebP header
        if (data[0] == (byte) 0x52 && data[1] == (byte) 0x49 && data[2] == (byte) 0x46 &&
                data[3] == (byte) 0x46 && data[8] == (byte) 0x57 && data[9] == (byte) 0x45 &&
                data[10] == (byte) 0x42 && data[11] == (byte) 0x50) {
            log.debug("Image data appears to be WebP based on header");
            return true;
        }

        // Check for TIFF header (Intel)
        if (data[0] == (byte) 0x49 && data[1] == (byte) 0x49 && data[2] == (byte) 0x2A && data[3] == (byte) 0x00) {
            log.debug("Image data appears to be TIFF (Intel) based on header");
            return true;
        }

        // Check for TIFF header (Motorola)
        if (data[0] == (byte) 0x4D && data[1] == (byte) 0x4D && data[2] == (byte) 0x00 && data[3] == (byte) 0x2A) {
            log.debug("Image data appears to be TIFF (Motorola) based on header");
            return true;
        }

        if (data.length >= 12) {
            log.warn("Unknown image format. First 12 bytes: {}",
                    String.format("%02X %02X %02X %02X %02X %02X %02X %02X %02X %02X %02X %02X",
                            data[0], data[1], data[2], data[3], data[4], data[5],
                            data[6], data[7], data[8], data[9], data[10], data[11]));
        }

        return false;
    }

    public byte[] generateExpertPdf(Report report) {
        log.info("Generating Expert PDF for report: {}", report.getId());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            document.open();

            // Add header with title
            Paragraph title = new Paragraph(
                    report.getTitle() != null ? report.getTitle() : "Expert Report",
                    new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD)
            );
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            // Add subtitle
            Paragraph subtitle = new Paragraph(
                    "Advanced Image Falsification Analysis",
                    new Font(Font.FontFamily.HELVETICA, 14, Font.ITALIC)
            );
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);
            document.add(Chunk.NEWLINE);

            // Add metadata table
            document.add(new Paragraph("Report Information", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
            document.add(new Paragraph("Report ID: " + (report.getId() != null ? report.getId() : "N/A")));
            document.add(new Paragraph("Case Number: " + (report.getCaseNumber() != null ? report.getCaseNumber() : "N/A")));
            document.add(new Paragraph("Created At: " + (report.getCreatedAt() != null ? report.getCreatedAt().format(DATE_FORMATTER) : "N/A")));
            document.add(new Paragraph("Expert ID: " + (report.getExpertId() != null ? report.getExpertId() : "N/A")));
            document.add(Chunk.NEWLINE);

            // Add description section
            if (report.getDescription() != null && !report.getDescription().isEmpty()) {
                document.add(new Paragraph("Description", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
                document.add(new Paragraph(report.getDescription()));
                document.add(Chunk.NEWLINE);
            }

            // Add verdict/conclusion if available
            if (report.getVerdict() != null && !report.getVerdict().isEmpty()) {
                document.add(new Paragraph("Conclusion", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
                document.add(new Paragraph(report.getVerdict()));
                document.add(Chunk.NEWLINE);
            }

            // Add judicial notes if available
            if (report.getJudicialNotes() != null && !report.getJudicialNotes().isEmpty()) {
                document.add(new Paragraph("Expert Notes", new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD)));
                document.add(new Paragraph(report.getJudicialNotes()));
                document.add(Chunk.NEWLINE);
            }

            // Add images with analyses to the expert PDF
            Map<String, Object> reportData = prepareReportData(report);
            addImagesToDocumentAfterHtml(document, reportData);

            document.close();

            log.info("Expert PDF generated successfully for report: {}", report.getId());
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error generating Expert PDF for report: {}", report.getId(), e);
            throw new RuntimeException("Failed to generate Expert PDF report", e);
        }
    }
}