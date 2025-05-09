package com.pcd.imageanalysis.services;

import com.pcd.imageanalysis.client.ImageServiceClient;
import com.pcd.imageanalysis.model.AnalysisResult;
import com.pcd.imageanalysis.model.Image;
import com.pcd.imageanalysis.repository.AnalysisResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ImageAnalysisService {
    private static final Logger log = LoggerFactory.getLogger(ImageAnalysisService.class);

    private final ImageServiceClient imageServiceClient;
    private final PyTorchModelService modelService;
    private final AnalysisResultRepository resultRepository;
    private final KafkaNotificationService kafkaNotificationService;

    @Value("${analysis.service.user-id:ANALYSIS_SERVICE}")
    private String serviceUserId;

    @Value("${analysis.service.user-role:SYSTEM}")
    private String serviceUserRole;

    @Value("${analysis.model.default.arch:MobileNetV3_Large}")
    private String defaultModelArchitecture;
    @Value("${analysis.model.default.height:224}")
    private int defaultModelImgHeight;
    @Value("${analysis.model.default.width:224}")
    private int defaultModelImgWidth;
    @Value("${analysis.model.default.dense:768}")
    private int defaultModelDenseUnits;
    @Value("${analysis.model.default.dropout:0.45}")
    private double defaultModelDropout;
    @Value("${analysis.model.default.version:1.0.0-mobilenetv3l-dense768}")
    private String defaultModelVersion;

    @Autowired
    public ImageAnalysisService(
            ImageServiceClient imageServiceClient,
            PyTorchModelService modelService,
            AnalysisResultRepository resultRepository,
            KafkaNotificationService kafkaNotificationService
    ) {
        this.imageServiceClient = imageServiceClient;
        this.modelService = modelService;
        this.resultRepository = resultRepository;
        this.kafkaNotificationService = kafkaNotificationService;
    }

    public Optional<AnalysisResult> analyzeImage(String imageId, String userId) {
        log.info("Starting analysis for image ID: {}", imageId);

        AnalysisResult result = new AnalysisResult();
        result.setImageId(imageId);
        result.setDate(LocalDateTime.now());
        result.setAnalysisStatus("IN_PROGRESS");
        result.setAnalysisType("AUTOMATIC");
        result.setAnalyzedBy(userId);

        result = resultRepository.save(result);

        Path tempImagePath = null;
        try {
            Optional<Image> imageOpt = imageServiceClient.getImageMetadata(imageId);
            if (imageOpt.isEmpty()) {
                throw new IllegalArgumentException("Image metadata not found with ID: " + imageId);
            }
            Image image = imageOpt.get();
            result.setCaseId(image.getCaseId());

            boolean statusUpdated = imageServiceClient.updateImageAnalysisStatus(imageId, "ANALYZING", serviceUserId, serviceUserRole);
            if (!statusUpdated) {
                log.warn("Failed to update image status to ANALYZING for image ID: {}. Aborting analysis.", imageId);
                throw new IOException("Failed to update image status before analysis for ID: " + imageId);
            }

            String safeFilename = image.getOriginalFilename() != null ? image.getOriginalFilename().replaceAll("[^a-zA-Z0-9.\\-]", "_") : "image";
            tempImagePath = Files.createTempFile("analysis_", "_" + safeFilename);
            log.debug("Created temporary image file: {}", tempImagePath);

            boolean downloadSuccess = imageServiceClient.downloadImageToFile(
                    imageId, serviceUserId, serviceUserRole, "Automated falsification analysis", tempImagePath
            );

            if (!downloadSuccess) {
                log.error("Failed to download image data directly to file for ID: {}", imageId);
                throw new IOException("Failed to download image data for ID: " + imageId);
            }

            if (Files.size(tempImagePath) == 0) {
                log.error("Downloaded image file is empty for ID: {}", imageId);
                throw new IOException("Downloaded image file is empty for ID: " + imageId);
            }

            String modelArchitecture = defaultModelArchitecture;
            int modelImgHeight = defaultModelImgHeight;
            int modelImgWidth = defaultModelImgWidth;
            int modelDenseUnits = defaultModelDenseUnits;
            double modelDropout = defaultModelDropout;
            String modelVersionToLog = defaultModelVersion;

            log.debug("Starting model analysis for image ID: {} using temp file: {}", imageId, tempImagePath);
            Map<String, Object> analysisResults = modelService.analyzeImage(
                    tempImagePath,
                    modelArchitecture,
                    modelImgHeight,
                    modelImgWidth,
                    modelDenseUnits,
                    modelDropout,
                    modelVersionToLog
            );
            log.info("Model analysis completed for image ID: {}", imageId);

            Object falsifiedObj = analysisResults.get("isFalsified");
            if (falsifiedObj instanceof Boolean) {
                result.setIsFalsified((Boolean) falsifiedObj);
            } else {
                log.warn("Analysis result for image {} missing or has incorrect type for 'isFalsified'", imageId);
                result.setIsFalsified(false);
            }

            Object scoreObj = analysisResults.get("confidenceScore");
            if (scoreObj instanceof Number) {
                result.setConfidenceScore(((Number) scoreObj).doubleValue());
            } else {
                log.warn("Analysis result for image {} missing or has incorrect type for 'confidenceScore'", imageId);
                result.setConfidenceScore(null);
            }

            // Store XAI visualization paths
            Object xaiVisualizationsObj = analysisResults.get("xaiVisualizations");
            if (xaiVisualizationsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, String> xaiVisualizations = (Map<String, String>) xaiVisualizationsObj;
                result.getDetectionDetails().put("xaiVisualizations", xaiVisualizations);
            }

            result.setAnalysisStatus("COMPLETED");
            result.setAnalysisVersion(analysisResults.getOrDefault("modelVersion", modelVersionToLog).toString());
            result.setDetectionDetails(analysisResults);
            result.setDate(LocalDateTime.now());

            String finalStatus = Boolean.TRUE.equals(result.getIsFalsified()) ? "FALSIFIED" : "AUTHENTIC";
            log.info("Updating final image status to {} for image ID: {}", finalStatus, imageId);
            imageServiceClient.updateImageAnalysisStatus(imageId, finalStatus, serviceUserId, serviceUserRole);

        } catch (Exception e) {
            log.error("Error analyzing image ID: {}", imageId, e);
            result.setAnalysisStatus("FAILED");
            result.setErrorMessage(e.getMessage());

            try {
                log.info("Attempting to update image status to ANALYSIS_FAILED for image ID: {}", imageId);
                imageServiceClient.updateImageAnalysisStatus(imageId, "ANALYSIS_FAILED", serviceUserId, serviceUserRole);
            } catch (Exception updateEx) {
                log.error("Failed to update image status to ANALYSIS_FAILED for image ID: {} after analysis error.", imageId, updateEx);
            }
        } finally {
            if (tempImagePath != null) {
                try {
                    boolean deleted = Files.deleteIfExists(tempImagePath);
                    log.debug("Temporary image file {} deleted: {}", tempImagePath, deleted);
                } catch (IOException e) {
                    log.warn("Could not delete temporary image file: {}", tempImagePath, e);
                }
            }
        }

        AnalysisResult finalResult = resultRepository.save(result);
        log.info("Analysis completed for image ID: {} with status: {}", imageId, finalResult.getAnalysisStatus());
        if ("COMPLETED".equals(finalResult.getAnalysisStatus())) {
            kafkaNotificationService.notifyAnalysisCompleted(finalResult);
        }
        return Optional.of(finalResult);
    }

    public Optional<AnalysisResult> getAnalysisResult(String imageId) {
        log.debug("Fetching analysis result for image ID: {}", imageId);
        List<AnalysisResult> results = resultRepository.findByImageId(imageId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public List<AnalysisResult> getAnalysisResultsByCase(String caseId) {
        log.debug("Fetching analysis results for case ID: {}", caseId);
        return resultRepository.findByCaseId(caseId);
    }

    public Optional<AnalysisResult> getAnalysisResultById(String id) {
        log.debug("Fetching analysis result for image ID: {}", id);
        return resultRepository.findById(id);
    }

    public Optional<String> getImageByAnalysisId(String Id) {
        return resultRepository.findById(Id).map(AnalysisResult::getImageId);
    }
}