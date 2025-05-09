package com.pcd.user.controllers;

import com.pcd.user.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/investigator")
@RequiredArgsConstructor
public class InvestigatorController {

    private static final Logger logger = LoggerFactory.getLogger(InvestigatorController.class);

    @GetMapping("/dashboard")
    public ResponseEntity<?> getInvestigatorDashboard() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            logger.warn("Unauthorized access attempt to investigator dashboard - authentication is null");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Check if Principal is actually a UserDetails object
        if (!(authentication.getPrincipal() instanceof UserDetails)) {
            logger.warn("Principal is not an instance of UserDetails: {}",
                    authentication.getPrincipal().getClass().getName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication");
        }

        UserDetails user = (UserDetails) authentication.getPrincipal();
        logger.info("Investigator dashboard accessed by: {}", user.getUsername());

        try {
            Map<String, Object> response = new HashMap<>();
            response.put("user", user.getUsername());
            response.put("role", "INVESTIGATOR");
            response.put("permissions", user.getAuthorities());

            // Recent activity
            List<Map<String, Object>> recentActivity = new ArrayList<>();
            Map<String, Object> activity1 = new HashMap<>();
            activity1.put("type", "EVIDENCE_UPLOAD");
            activity1.put("caseId", "Case-001");
            activity1.put("timestamp", LocalDateTime.now().minusHours(2));
            activity1.put("details", "Uploaded 3 images for analysis");

            Map<String, Object> activity2 = new HashMap<>();
            activity2.put("type", "CASE_ASSIGNMENT");
            activity2.put("caseId", "Case-002");
            activity2.put("timestamp", LocalDateTime.now().minusDays(1));
            activity2.put("details", "Assigned to new case");

            recentActivity.add(activity1);
            recentActivity.add(activity2);
            response.put("recentActivity", recentActivity);

            // Case statistics
            Map<String, Object> caseStats = new HashMap<>();
            caseStats.put("totalCases", 12);
            caseStats.put("activeCases", 5);
            caseStats.put("pendingReview", 3);
            caseStats.put("completed", 4);
            response.put("caseStatistics", caseStats);

            // Pending tasks
            List<Map<String, Object>> pendingTasks = new ArrayList<>();
            Map<String, Object> task1 = new HashMap<>();
            task1.put("taskId", "Task-001");
            task1.put("caseId", "Case-001");
            task1.put("description", "Submit final investigation report");
            task1.put("dueDate", LocalDateTime.now().plusDays(2));
            task1.put("priority", "HIGH");

            Map<String, Object> task2 = new HashMap<>();
            task2.put("taskId", "Task-002");
            task2.put("caseId", "Case-002");
            task2.put("description", "Collect additional evidence");
            task2.put("dueDate", LocalDateTime.now().plusDays(5));
            task2.put("priority", "MEDIUM");

            pendingTasks.add(task1);
            pendingTasks.add(task2);
            response.put("pendingTasks", pendingTasks);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving investigator dashboard for user {}: {}",
                    user.getUsername(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving dashboard data");
        }
    }

    @GetMapping("/cases")
    public ResponseEntity<Page<Map<String, Object>>> getInvestigatorCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Cases list requested by investigator {}: page={}, size={}, sortBy={}, sortDir={}, status={}, search={}",
                user.getEmail(), page, size, sortBy, sortDir, status, search);

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // In a real implementation, you would fetch cases from a database
            List<Map<String, Object>> cases = new ArrayList<>();

            for (int i = 0; i < 20; i++) {
                Map<String, Object> caseData = new HashMap<>();
                caseData.put("caseId", "Case-" + (1000 + i));
                caseData.put("title", "Investigation Case #" + (1000 + i));
                caseData.put("status", getRandomStatus());
                caseData.put("createdAt", LocalDateTime.now().minusDays(i));
                caseData.put("updatedAt", LocalDateTime.now().minusHours(i * 5));
                caseData.put("priority", getRandomPriority());
                caseData.put("evidenceCount", new Random().nextInt(10) + 1);

                cases.add(caseData);
            }

            // Filter by status if provided
            if (status != null && !status.isEmpty()) {
                cases = cases.stream()
                        .filter(c -> status.equalsIgnoreCase((String) c.get("status")))
                        .toList();
            }

            // Filter by search term if provided
            if (search != null && !search.isEmpty()) {
                cases = cases.stream()
                        .filter(c -> ((String) c.get("title")).toLowerCase().contains(search.toLowerCase()) ||
                                ((String) c.get("caseId")).toLowerCase().contains(search.toLowerCase()))
                        .toList();
            }

            // Create a Page object
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), cases.size());

            List<Map<String, Object>> pageContent = start < end ? cases.subList(start, end) : Collections.emptyList();

            Page<Map<String, Object>> casesPage = new org.springframework.data.domain.PageImpl<>(
                    pageContent, pageable, cases.size());

            return ResponseEntity.ok(casesPage);
        } catch (Exception e) {
            logger.error("Error retrieving cases for investigator {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving cases");
        }
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<Map<String, Object>> getCaseDetails(
            @PathVariable String caseId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case details requested by investigator {}: Case ID: {}",
                user.getEmail(), caseId);

        try {
            // In a real implementation, you would fetch case details from a database
            Map<String, Object> caseDetails = new HashMap<>();
            caseDetails.put("caseId", caseId);
            caseDetails.put("title", "Investigation Case #" + caseId);
            caseDetails.put("description", "Detailed investigation of potential image falsification in legal documents.");
            caseDetails.put("status", "UNDER_INVESTIGATION");
            caseDetails.put("priority", "HIGH");
            caseDetails.put("createdAt", LocalDateTime.now().minusDays(5));
            caseDetails.put("updatedAt", LocalDateTime.now().minusHours(12));
            caseDetails.put("assignedTo", user.getUsername());
            caseDetails.put("evidenceCount", 7);

            // Case timeline
            List<Map<String, Object>> timeline = new ArrayList<>();
            Map<String, Object> event1 = new HashMap<>();
            event1.put("eventType", "CASE_CREATED");
            event1.put("timestamp", LocalDateTime.now().minusDays(5));
            event1.put("user", "Admin User");
            event1.put("details", "Case created and assigned to investigator");

            Map<String, Object> event2 = new HashMap<>();
            event2.put("eventType", "EVIDENCE_ADDED");
            event2.put("timestamp", LocalDateTime.now().minusDays(4));
            event2.put("user", user.getUsername());
            event2.put("details", "Initial evidence uploaded (3 images)");

            Map<String, Object> event3 = new HashMap<>();
            event3.put("eventType", "ANALYSIS_REQUESTED");
            event3.put("timestamp", LocalDateTime.now().minusDays(3));
            event3.put("user", user.getUsername());
            event3.put("details", "Analysis requested for evidence items");

            timeline.add(event1);
            timeline.add(event2);
            timeline.add(event3);
            caseDetails.put("timeline", timeline);

            // Evidence items
            List<Map<String, Object>> evidence = new ArrayList<>();
            for (int i = 1; i <= 7; i++) {
                Map<String, Object> item = new HashMap<>();
                item.put("evidenceId", "EVD-" + caseId + "-" + i);
                item.put("type", i <= 5 ? "IMAGE" : "DOCUMENT");
                item.put("filename", "evidence_" + i + (i <= 5 ? ".jpg" : ".pdf"));
                item.put("uploadedAt", LocalDateTime.now().minusDays(5).plusHours(i));
                item.put("uploadedBy", user.getUsername());
                item.put("analysisStatus", i <= 3 ? "COMPLETED" : (i <= 5 ? "IN_PROGRESS" : "PENDING"));
                item.put("isFalsified", i == 2 || i == 3);

                evidence.add(item);
            }
            caseDetails.put("evidence", evidence);

            // Related cases
            List<String> relatedCases = List.of("Case-1005", "Case-1012");
            caseDetails.put("relatedCases", relatedCases);

            return ResponseEntity.ok(caseDetails);
        } catch (Exception e) {
            logger.error("Error retrieving case details for Case ID {}: {}", caseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving case details");
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> submitEvidence(
            @RequestParam("file") MultipartFile file,
            @RequestParam("caseId") String caseId,
            @RequestParam("description") String description,
            @RequestParam(value = "tags", required = false) List<String> tags,
            @RequestParam(value = "metadata", required = false) String metadata,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Evidence submitted by investigator {}: Case ID: {}, File: {}",
                user.getEmail(), caseId, file.getOriginalFilename());

        try {
            // Validate file
            if (file.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File cannot be empty");
            }

            // Check file type
            String contentType = file.getContentType();
            if (contentType == null || !(contentType.startsWith("image/") || contentType.equals("application/pdf"))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid file type. Only images and PDFs are allowed.");
            }

            // Check file size (max 10MB)
            if (file.getSize() > 10 * 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "File size exceeds the maximum limit of 10MB");
            }

            // In a real implementation, you would:
            // 1. Store the file using the ImageManagement service
            // 2. Create an evidence record in the database
            // 3. Update the case with the new evidence

            String evidenceId = "EVD-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Evidence submitted successfully");
            response.put("caseId", caseId);
            response.put("evidenceId", evidenceId);
            response.put("filename", file.getOriginalFilename());
            response.put("fileSize", file.getSize());
            response.put("contentType", contentType);
            response.put("uploadedAt", LocalDateTime.now());
            response.put("uploadedBy", user.getUsername());

            // Add analysis request details
            Map<String, Object> analysisRequest = new HashMap<>();
            analysisRequest.put("status", "QUEUED");
            analysisRequest.put("estimatedCompletionTime", LocalDateTime.now().plusMinutes(30));
            response.put("analysisRequest", analysisRequest);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Error submitting evidence: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error submitting evidence");
        }
    }

    @PostMapping("/cases/{caseId}/report")
    public ResponseEntity<Map<String, Object>> submitInvestigationReport(
            @PathVariable String caseId,
            @Valid @RequestBody SubmitReportRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Investigation report submitted by investigator {}: Case ID: {}",
                user.getEmail(), caseId);

        try {
            // In a real implementation, you would:
            // 1. Validate the report data
            // 2. Store the report in the database
            // 3. Update the case status

            String reportId = "RPT-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Investigation report submitted successfully");
            response.put("caseId", caseId);
            response.put("reportId", reportId);
            response.put("submittedAt", LocalDateTime.now());
            response.put("submittedBy", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error submitting investigation report: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error submitting report");
        }
    }

    @GetMapping("/evidence/{evidenceId}")
    public ResponseEntity<Map<String, Object>> getEvidenceDetails(
            @PathVariable String evidenceId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Evidence details requested by investigator {}: Evidence ID: {}",
                user.getEmail(), evidenceId);

        try {
            // In a real implementation, you would fetch evidence details from a database
            Map<String, Object> evidenceDetails = new HashMap<>();
            evidenceDetails.put("evidenceId", evidenceId);
            evidenceDetails.put("caseId", "Case-1001");
            evidenceDetails.put("type", "IMAGE");
            evidenceDetails.put("filename", "evidence_photo.jpg");
            evidenceDetails.put("fileSize", 2.4 * 1024 * 1024); // 2.4 MB
            evidenceDetails.put("contentType", "image/jpeg");
            evidenceDetails.put("uploadedAt", LocalDateTime.now().minusDays(2));
            evidenceDetails.put("uploadedBy", user.getUsername());
            evidenceDetails.put("description", "Photograph of potentially falsified document");

            // Analysis results
            Map<String, Object> analysisResults = new HashMap<>();
            analysisResults.put("status", "COMPLETED");
            analysisResults.put("completedAt", LocalDateTime.now().minusHours(12));
            analysisResults.put("isFalsified", true);
            analysisResults.put("confidenceScore", 0.92);
            analysisResults.put("detectedManipulations", List.of("SPLICING", "COPY_MOVE"));
            analysisResults.put("analysisMethod", "DEEP_LEARNING");

            evidenceDetails.put("analysisResults", analysisResults);

            // Custody trail
            List<Map<String, Object>> custodyTrail = new ArrayList<>();
            Map<String, Object> event1 = new HashMap<>();
            event1.put("eventType", "UPLOAD");
            event1.put("timestamp", LocalDateTime.now().minusDays(2));
            event1.put("user", user.getUsername());
            event1.put("details", "Initial upload");

            Map<String, Object> event2 = new HashMap<>();
            event2.put("eventType", "ANALYSIS");
            event2.put("timestamp", LocalDateTime.now().minusDays(1));
            event2.put("user", "System");
            event2.put("details", "Automated analysis performed");

            Map<String, Object> event3 = new HashMap<>();
            event3.put("eventType", "ACCESS");
            event3.put("timestamp", LocalDateTime.now().minusHours(12));
            event3.put("user", "Expert User");
            event3.put("details", "Expert review");

            custodyTrail.add(event1);
            custodyTrail.add(event2);
            custodyTrail.add(event3);
            evidenceDetails.put("custodyTrail", custodyTrail);

            return ResponseEntity.ok(evidenceDetails);
        } catch (Exception e) {
            logger.error("Error retrieving evidence details for Evidence ID {}: {}", evidenceId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving evidence details");
        }
    }

    @PutMapping("/cases/{caseId}/status")
    public ResponseEntity<Map<String, Object>> updateCaseStatus(
            @PathVariable String caseId,
            @Valid @RequestBody UpdateCaseStatusRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case status update requested by investigator {}: Case ID: {}, New Status: {}",
                user.getEmail(), caseId, request.getStatus());

        try {
            // In a real implementation, you would:
            // 1. Validate the status change
            // 2. Update the case status in the database
            // 3. Log the status change

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Case status updated successfully");
            response.put("caseId", caseId);
            response.put("previousStatus", "UNDER_INVESTIGATION");
            response.put("newStatus", request.getStatus());
            response.put("updatedAt", LocalDateTime.now());
            response.put("updatedBy", user.getUsername());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating case status: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating case status");
        }
    }

    // Helper methods

    private String getRandomStatus() {
        String[] statuses = {"PENDING", "UNDER_INVESTIGATION", "PENDING_REVIEW", "COMPLETED", "ARCHIVED"};
        return statuses[new Random().nextInt(statuses.length)];
    }

    private String getRandomPriority() {
        String[] priorities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};
        return priorities[new Random().nextInt(priorities.length)];
    }

    // Request/Response classes

    @Data
    public static class SubmitReportRequest {
        @NotBlank(message = "Report title is required")
        private String title;

        @NotBlank(message = "Report content is required")
        private String content;

        private List<String> evidenceIds;

        private List<String> findings;

        private String conclusion;

        private List<String> recommendations;
    }

    @Data
    public static class UpdateCaseStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;

        private String reason;
    }
}
