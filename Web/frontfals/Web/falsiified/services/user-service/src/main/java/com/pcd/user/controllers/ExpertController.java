package com.pcd.user.controllers;

import com.pcd.dto.enums.Role;
import com.pcd.dto.records.UserResponseDTO;
import com.pcd.user.model.User;
import com.pcd.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/expert")
@RequiredArgsConstructor
public class ExpertController {

    private static final Logger logger = LoggerFactory.getLogger(ExpertController.class);
    private final UserService userService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getExpertDashboard(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        logger.info("Expert dashboard accessed by: {}", user.getEmail());

        try {
            Map<String, Object> response = new HashMap<>();
            response.put("user", user.getUsername());
            response.put("role", "EXPERT");
            response.put("permissions", user.getAuthorities());

            // Recent activity
            List<Map<String, Object>> recentActivity = new ArrayList<>();
            Map<String, Object> activity1 = new HashMap<>();
            activity1.put("type", "ANALYSIS_COMPLETED");
            activity1.put("imageId", "IMG-1001");
            activity1.put("timestamp", LocalDateTime.now().minusHours(3));
            activity1.put("details", "Completed analysis of suspected falsified image");

            Map<String, Object> activity2 = new HashMap<>();
            activity2.put("type", "REPORT_SUBMITTED");
            activity2.put("reportId", "RPT-2001");
            activity2.put("timestamp", LocalDateTime.now().minusDays(1));
            activity2.put("details", "Submitted expert report on image analysis");

            recentActivity.add(activity1);
            recentActivity.add(activity2);
            response.put("recentActivity", recentActivity);

            // Analysis statistics
            Map<String, Object> analysisStats = new HashMap<>();
            analysisStats.put("totalAnalyses", 45);
            analysisStats.put("pendingAnalyses", 8);
            analysisStats.put("completedToday", 3);
            analysisStats.put("falsifiedDetected", 28);
            analysisStats.put("averageConfidenceScore", 0.87);
            response.put("analysisStatistics", analysisStats);

            // Pending tasks
            List<Map<String, Object>> pendingTasks = new ArrayList<>();
            Map<String, Object> task1 = new HashMap<>();
            task1.put("taskId", "Task-001");
            task1.put("imageId", "IMG-1005");
            task1.put("description", "Analyze suspected manipulation in court document");
            task1.put("dueDate", LocalDateTime.now().plusDays(1));
            task1.put("priority", "HIGH");

            Map<String, Object> task2 = new HashMap<>();
            task2.put("taskId", "Task-002");
            task2.put("imageId", "IMG-1008");
            task2.put("description", "Review automated analysis results");
            task2.put("dueDate", LocalDateTime.now().plusDays(2));
            task2.put("priority", "MEDIUM");

            pendingTasks.add(task1);
            pendingTasks.add(task2);
            response.put("pendingTasks", pendingTasks);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving expert dashboard for user {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving dashboard data");
        }
    }

    @GetMapping("/analyses")
    public ResponseEntity<Page<Map<String, Object>>> getAnalyses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean isFalsified,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Analyses list requested by expert {}: page={}, size={}, sortBy={}, sortDir={}, status={}, isFalsified={}",
                user.getEmail(), page, size, sortBy, sortDir, status, isFalsified);

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // In a real implementation, you would fetch analyses from a database
            List<Map<String, Object>> analyses = new ArrayList<>();

            for (int i = 0; i < 25; i++) {
                Map<String, Object> analysis = new HashMap<>();
                analysis.put("analysisId", "ANL-" + (1000 + i));
                analysis.put("imageId", "IMG-" + (2000 + i));
                analysis.put("caseId", "Case-" + (3000 + i % 5));
                analysis.put("status", getRandomAnalysisStatus());
                analysis.put("createdAt", LocalDateTime.now().minusDays(i % 10));
                analysis.put("completedAt", i < 20 ? LocalDateTime.now().minusDays(i % 10).plusHours(2) : null);

                boolean detected = new Random().nextBoolean();
                analysis.put("isFalsified", detected);
                if (detected) {
                    analysis.put("confidenceScore", 0.7 + (new Random().nextDouble() * 0.3));
                    analysis.put("detectedManipulations", getRandomManipulations());
                }

                analyses.add(analysis);
            }

            // Filter by status if provided
            if (status != null && !status.isEmpty()) {
                analyses = analyses.stream()
                        .filter(a -> status.equalsIgnoreCase((String) a.get("status")))
                        .toList();
            }

            // Filter by falsified flag if provided
            if (isFalsified != null) {
                analyses = analyses.stream()
                        .filter(a -> a.get("isFalsified") != null && isFalsified.equals(a.get("isFalsified")))
                        .toList();
            }

            // Create a Page object
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), analyses.size());

            List<Map<String, Object>> pageContent = start < end ? analyses.subList(start, end) : Collections.emptyList();

            Page<Map<String, Object>> analysesPage = new org.springframework.data.domain.PageImpl<>(
                    pageContent, pageable, analyses.size());

            return ResponseEntity.ok(analysesPage);
        } catch (Exception e) {
            logger.error("Error retrieving analyses for expert {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving analyses");
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadReferenceImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("description") String description,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Reference image uploaded by expert {}: {}",
                user.getEmail(), file.getOriginalFilename());

        try {
            // Validate file
            if (file.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File cannot be empty");
            }

            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid file type. Only images are allowed.");
            }

            // Check file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File size exceeds the maximum limit of 10MB");
            }

            // In a real implementation, you would:
            // 1. Store the file using the ImageManagement service
            // 2. Create a reference image record in the database

            String imageId = "IMG-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Reference image uploaded successfully");
            response.put("imageId", imageId);
            response.put("filename", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", contentType);
            response.put("uploadedAt", LocalDateTime.now());
            response.put("uploadedBy", user.getUsername());
            response.put("description", description);

            if (tags != null && !tags.isEmpty()) {
                response.put("tags", tags);
            }

            if (metadata != null && !metadata.isEmpty()) {
                response.put("metadata", metadata);
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error uploading reference image: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error uploading reference image");
        }
    }

    @PostMapping("/analyse")
    public ResponseEntity<Map<String, Object>> analyzeImage(
            @RequestParam("imageId") String imageId,
            @RequestParam(value = "techniques", required = false) List<String> techniques,
            @RequestParam(value = "priority", required = false, defaultValue = "NORMAL") String priority,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Image analysis requested by expert {}: Image ID: {}, Techniques: {}, Priority: {}",
                user.getEmail(), imageId, techniques, priority);

        try {
            // In a real implementation, you would:
            // 1. Validate the image ID
            // 2. Call the ImageAnalysis service to analyze the image
            // 3. Return the analysis results or job ID

            String analysisId = "ANL-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Analysis initiated");
            response.put("analysisId", analysisId);
            response.put("imageId", imageId);
            response.put("requestedAt", LocalDateTime.now());
            response.put("requestedBy", user.getUsername());
            response.put("priority", priority);

            if (techniques != null && !techniques.isEmpty()) {
                response.put("techniques", techniques);
            } else {
                response.put("techniques", List.of("DEEP_LEARNING", "ELA", "NOISE_ANALYSIS"));
            }

            response.put("estimatedCompletionTime", LocalDateTime.now().plusMinutes(30));
            response.put("status", "QUEUED");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error initiating image analysis: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error initiating image analysis");
        }
    }

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<Map<String, Object>> getAnalysisResults(
            @PathVariable String analysisId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Analysis results requested by expert {}: Analysis ID: {}",
                user.getEmail(), analysisId);

        try {
            // In a real implementation, you would fetch the analysis results from the database
            Map<String, Object> analysisResults = new HashMap<>();
            analysisResults.put("analysisId", analysisId);
            analysisResults.put("imageId", "IMG-" + (analysisId.hashCode() % 1000 + 2000));
            analysisResults.put("status", "COMPLETED");
            analysisResults.put("requestedAt", LocalDateTime.now().minusHours(2));
            analysisResults.put("completedAt", LocalDateTime.now().minusHours(1));
            analysisResults.put("requestedBy", user.getUsername());

            // Analysis details
            analysisResults.put("isFalsified", true);
            analysisResults.put("confidenceScore", 0.92);
            analysisResults.put("detectedManipulations", List.of("SPLICING", "COPY_MOVE"));

            // Detailed results by technique
            List<Map<String, Object>> techniqueResults = new ArrayList<>();

            Map<String, Object> deepLearningResult = new HashMap<>();
            deepLearningResult.put("technique", "DEEP_LEARNING");
            deepLearningResult.put("isFalsified", true);
            deepLearningResult.put("confidenceScore", 0.94);
            deepLearningResult.put("details", "CNN model detected manipulation patterns consistent with splicing");

            Map<String, Object> elaResult = new HashMap<>();
            elaResult.put("technique", "ELA");
            elaResult.put("isFalsified", true);
            elaResult.put("confidenceScore", 0.89);
            elaResult.put("details", "Error Level Analysis revealed inconsistent compression artifacts");

            Map<String, Object> noiseResult = new HashMap<>();
            noiseResult.put("technique", "NOISE_ANALYSIS");
            noiseResult.put("isFalsified", true);
            noiseResult.put("confidenceScore", 0.87);
            noiseResult.put("details", "Noise pattern inconsistencies detected in multiple regions");

            techniqueResults.add(deepLearningResult);
            techniqueResults.add(elaResult);
            techniqueResults.add(noiseResult);

            analysisResults.put("techniqueResults", techniqueResults);

            // Manipulation regions
            List<Map<String, Object>> regions = new ArrayList<>();

            Map<String, Object> region1 = new HashMap<>();
            region1.put("type", "SPLICING");
            region1.put("boundingBox", Map.of("x", 120, "y", 80, "width", 200, "height", 150));
            region1.put("confidenceScore", 0.95);

            Map<String, Object> region2 = new HashMap<>();
            region2.put("type", "COPY_MOVE");
            region2.put("boundingBox", Map.of("x", 450, "y", 320, "width", 180, "height", 120));
            region2.put("confidenceScore", 0.91);

            regions.add(region1);
            regions.add(region2);

            analysisResults.put("manipulationRegions", regions);

            return ResponseEntity.ok(analysisResults);
        } catch (Exception e) {
            logger.error("Error retrieving analysis results for Analysis ID {}: {}", analysisId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving analysis results");
        }
    }

    // Helper methods

    private String getRandomAnalysisStatus() {
        String[] statuses = {"QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED"};
        return statuses[new Random().nextInt(statuses.length)];
    }

    private List<String> getRandomManipulations() {
        String[] manipulations = {"SPLICING", "COPY_MOVE", "INPAINTING", "OBJECT_REMOVAL", "COLOR_ADJUSTMENT"};
        int count = new Random().nextInt(3) + 1;
        List<String> result = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            result.add(manipulations[new Random().nextInt(manipulations.length)]);
        }

        return result;
    }
    /**
     * GET /users/experts : Get all users with ROLE_EXPERT
     *
     * @return List of expert users
     */
    @GetMapping("/all")
    public ResponseEntity<List<UserResponseDTO>> getAllExperts() {
        logger.debug("REST request to get all users with role EXPERT");
        List<UserResponseDTO> experts = userService.getAllUsers().stream()
                .filter(user -> user.role() == Role.EXPERT)
                .collect(Collectors.toList());
        return ResponseEntity.ok(experts);
    }



}
