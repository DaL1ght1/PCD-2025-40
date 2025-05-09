package com.pcd.imageanalysis.controller;

import com.pcd.imageanalysis.model.AnalysisResult;
import com.pcd.imageanalysis.repository.AnalysisResultRepository;
import com.pcd.imageanalysis.services.ImageAnalysisService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/analysis")
public class ImageAnalysisController {
    private static final Logger log = LoggerFactory.getLogger(ImageAnalysisController.class);

    private final ImageAnalysisService analysisService;
    private final AnalysisResultRepository analysisResultRepository;

    @Autowired
    public ImageAnalysisController(ImageAnalysisService analysisService, AnalysisResultRepository analysisResultRepository) {
        this.analysisService = analysisService;
        this.analysisResultRepository = analysisResultRepository;
    }

    @PostMapping("/{imageId}")
    public ResponseEntity<AnalysisResult> analyzeImage(
            @PathVariable String imageId,
            @RequestParam(value = "userId", required = false) String userId,
            HttpServletRequest request) {
        log.info("Received analysis request for image ID: {} from user: {}", imageId, userId);
        try {
            return analysisService.analyzeImage(imageId, userId)
                    .map(ResponseEntity::ok)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.INTERNAL_SERVER_ERROR, "Analysis failed to complete"));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            log.error("Error processing analysis request for image ID: {}", imageId, e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Failed to process analysis request: " + e.getMessage());
        }
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<AnalysisResult> getAnalysisResult(@PathVariable String imageId) {
        return analysisService.getAnalysisResult(imageId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No analysis result found for image ID: " + imageId));
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<Iterable<AnalysisResult>> getAnalysisResultsByCase(@PathVariable String caseId) {
        return ResponseEntity.ok(analysisService.getAnalysisResultsByCase(caseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResult> getAnalysisResultById(@PathVariable String id) {
        log.debug("Fetching analysis result with ID: {}", id);
        Optional<AnalysisResult> analysisResult = analysisService.getAnalysisResultById(id);
        return analysisResult
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Analysis result not found with ID: " + id));
    }

    @PostMapping("/by-image-ids")
    public ResponseEntity<List<AnalysisResult>> getAnalysesByImageIds(@RequestBody List<String> imageIds) {
        if (imageIds == null || imageIds.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<AnalysisResult> results = analysisResultRepository.findByImageIdIn(imageIds);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{analysisId}/xai-visualization/{type}")
    public ResponseEntity<FileSystemResource> getXaiVisualization(
            @PathVariable String analysisId,
            @PathVariable String type) {
        log.debug("Fetching XAI visualization of type {} for analysis ID: {}", type, analysisId);
        Optional<AnalysisResult> analysisResultOpt = analysisService.getAnalysisResultById(analysisId);
        if (analysisResultOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Analysis result not found with ID: " + analysisId);
        }

        AnalysisResult analysisResult = analysisResultOpt.get();
        Map<String, Object> detectionDetails = analysisResult.getDetectionDetails();
        Object xaiVisualizationsObj = detectionDetails.get("xaiVisualizations");
        if (!(xaiVisualizationsObj instanceof Map)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No XAI visualizations found for analysis ID: " + analysisId);
        }

        @SuppressWarnings("unchecked")
        Map<String, String> xaiVisualizations = (Map<String, String>) xaiVisualizationsObj;
        String visualizationPath = xaiVisualizations.get(type);
        if (visualizationPath == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "XAI visualization type " + type + " not found for analysis ID: " + analysisId);
        }

        Path path = Paths.get(visualizationPath);
        if (!path.toFile().exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Visualization file not found for type: " + type);
        }

        FileSystemResource resource = new FileSystemResource(path);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }
}