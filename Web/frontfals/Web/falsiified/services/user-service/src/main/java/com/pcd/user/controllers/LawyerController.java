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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/lawyer")
@RequiredArgsConstructor

public class LawyerController {

    private static final Logger logger = LoggerFactory.getLogger(LawyerController.class);

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getLawyerDashboard(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        logger.info("Lawyer dashboard accessed by: {}", user.getEmail());

        try {
            Map<String, Object> response = new HashMap<>();
            response.put("user", user.getUsername());
            response.put("role", "LAWYER");
            response.put("permissions", user.getAuthorities());

            // Recent activity
            List<Map<String, Object>> recentActivity = new ArrayList<>();
            Map<String, Object> activity1 = new HashMap<>();
            activity1.put("type", "CASE_CREATED");
            activity1.put("caseId", "Case-201");
            activity1.put("timestamp", LocalDateTime.now().minusDays(1));
            activity1.put("details", "Created new case for Client A");

            Map<String, Object> activity2 = new HashMap<>();
            activity2.put("type", "BRIEF_SUBMITTED");
            activity2.put("caseId", "Case-202");
            activity2.put("timestamp", LocalDateTime.now().minusHours(5));
            activity2.put("details", "Submitted legal brief for court hearing");

            recentActivity.add(activity1);
            recentActivity.add(activity2);
            response.put("recentActivity", recentActivity);

            // Case statistics
            Map<String, Object> caseStats = new HashMap<>();
            caseStats.put("totalCases", 18);
            caseStats.put("activeCases", 12);
            caseStats.put("pendingCourt", 5);
            caseStats.put("completed", 6);
            response.put("caseStatistics", caseStats);

            // Upcoming court dates
            List<Map<String, Object>> upcomingCourt = new ArrayList<>();
            Map<String, Object> court1 = new HashMap<>();
            court1.put("caseId", "Case-201");
            court1.put("client", "Client A");
            court1.put("courtDate", LocalDateTime.now().plusDays(5));
            court1.put("location", "District Court, Room 305");
            court1.put("type", "HEARING");

            Map<String, Object> court2 = new HashMap<>();
            court2.put("caseId", "Case-203");
            court2.put("client", "Client C");
            court2.put("courtDate", LocalDateTime.now().plusDays(12));
            court2.put("location", "Supreme Court, Room 101");
            court2.put("type", "TRIAL");

            upcomingCourt.add(court1);
            upcomingCourt.add(court2);
            response.put("upcomingCourtDates", upcomingCourt);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving lawyer dashboard for user {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving dashboard data");
        }
    }

    @GetMapping("/cases")
    public ResponseEntity<Page<Map<String, Object>>> getLawyerCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String client,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Cases list requested by lawyer {}: page={}, size={}, sortBy={}, sortDir={}, status={}, client={}, search={}",
                user.getEmail(), page, size, sortBy, sortDir, status, client, search);

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // In a real implementation, you would fetch cases from a database
            List<Map<String, Object>> cases = new ArrayList<>();

            for (int i = 0; i < 20; i++) {
                Map<String, Object> caseData = new HashMap<>();
                caseData.put("caseId", "Case-" + (200 + i));
                caseData.put("title", "Legal Case #" + (200 + i));
                caseData.put("status", getRandomCaseStatus());
                caseData.put("createdAt", LocalDateTime.now().minusDays(i));
                caseData.put("updatedAt", LocalDateTime.now().minusHours(i * 5));
                caseData.put("client", "Client " + (char)('A' + (i % 8)));
                caseData.put("courtDate", i % 3 == 0 ? LocalDateTime.now().plusDays(i + 5) : null);
                caseData.put("evidenceCount", new Random().nextInt(10) + 1);

                cases.add(caseData);
            }

            // Filter by status if provided
            if (status != null && !status.isEmpty()) {
                cases = cases.stream()
                        .filter(c -> status.equalsIgnoreCase((String) c.get("status")))
                        .toList();
            }

            // Filter by client if provided
            if (client != null && !client.isEmpty()) {
                cases = cases.stream()
                        .filter(c -> client.equalsIgnoreCase((String) c.get("client")))
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
            logger.error("Error retrieving cases for lawyer {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving cases");
        }
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<Map<String, Object>> getCaseDetails(
            @PathVariable String caseId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case details requested by lawyer {}: Case ID: {}",
                user.getEmail(), caseId);

        try {
            // In a real implementation, you would fetch case details from a database
            Map<String, Object> caseDetails = new HashMap<>();
            caseDetails.put("caseId", caseId);
            caseDetails.put("title", "Legal Case #" + caseId);
            caseDetails.put("description", "Case involving potential falsified evidence in contract dispute.");
            caseDetails.put("status", "ACTIVE");
            caseDetails.put("createdAt", LocalDateTime.now().minusDays(15));
            caseDetails.put("updatedAt", LocalDateTime.now().minusHours(36));
            caseDetails.put("client", "Client A");
            caseDetails.put("courtDate", LocalDateTime.now().plusDays(15));
            caseDetails.put("courtLocation", "District Court, Room 305");
            caseDetails.put("judge", "Hon. Judge Smith");
            caseDetails.put("opposingCounsel", "Johnson & Associates");
            caseDetails.put("evidenceCount", 8);

            // Case timeline
            List<Map<String, Object>> timeline = new ArrayList<>();
            Map<String, Object> event1 = new HashMap<>();
            event1.put("eventType", "CASE_CREATED");
            event1.put("timestamp", LocalDateTime.now().minusDays(15));
            event1.put("user", user.getUsername());
            event1.put("details", "Case created");

            Map<String, Object> event2 = new HashMap<>();
            event2.put("eventType", "EVIDENCE_ADDED");
            event2.put("timestamp", LocalDateTime.now().minusDays(12));
            event2.put("user", "Investigator User");
            event2.put("details", "Initial evidence uploaded (5 documents)");

            Map<String, Object> event3 = new HashMap<>();
            event3.put("eventType", "ANALYSIS_COMPLETED");
            event3.put("timestamp", LocalDateTime.now().minusDays(8));
            event3.put("user", "Expert User");
            event3.put("details", "Analysis completed on 3 images, 2 confirmed falsified");

            Map<String, Object> event4 = new HashMap<>();
            event4.put("eventType", "BRIEF_SUBMITTED");
            event4.put("timestamp", LocalDateTime.now().minusDays(2));
            event4.put("user", user.getUsername());
            event4.put("details", "Legal brief submitted to court");

            timeline.add(event1);
            timeline.add(event2);
            timeline.add(event3);
            timeline.add(event4);
            caseDetails.put("timeline", timeline);

            // Evidence items
            List<Map<String, Object>> evidence = new ArrayList<>();
            for (int i = 1; i <= 8; i++) {
                Map<String, Object> item = new HashMap<>();
                item.put("evidenceId", "EVD-" + caseId + "-" + i);
                item.put("type", i <= 5 ? "IMAGE" : "DOCUMENT");
                item.put("filename", "evidence_" + i + (i <= 5 ? ".jpg" : ".pdf"));
                item.put("uploadedAt", LocalDateTime.now().minusDays(12).plusHours(i));
                item.put("uploadedBy", "Investigator User");
                item.put("analysisStatus", i <= 5 ? "COMPLETED" : "PENDING");
                item.put("isFalsified", i == 2 || i == 3);

                evidence.add(item);
            }
            caseDetails.put("evidence", evidence);

            // Legal documents
            List<Map<String, Object>> documents = new ArrayList<>();
            Map<String, Object> doc1 = new HashMap<>();
            doc1.put("documentId", "DOC-" + caseId + "-1");
            doc1.put("type", "LEGAL_BRIEF");
            doc1.put("title", "Initial Legal Brief");
            doc1.put("createdAt", LocalDateTime.now().minusDays(10));
            doc1.put("createdBy", user.getUsername());
            doc1.put("status", "SUBMITTED");

            Map<String, Object> doc2 = new HashMap<>();
            doc2.put("documentId", "DOC-" + caseId + "-2");
            doc2.put("type", "EXPERT_REPORT");
            doc2.put("title", "Expert Analysis Report");
            doc2.put("createdAt", LocalDateTime.now().minusDays(8));
            doc2.put("createdBy", "Expert User");
            doc2.put("status", "FINAL");

            documents.add(doc1);
            documents.add(doc2);
            caseDetails.put("legalDocuments", documents);

            return ResponseEntity.ok(caseDetails);
        } catch (Exception e) {
            logger.error("Error retrieving case details for Case ID {}: {}", caseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving case details");
        }
    }

    @PostMapping("/cases")
    public ResponseEntity<Map<String, Object>> createCase(
            @Valid @RequestBody CreateCaseRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case creation requested by lawyer {}: Title: {}, Client: {}",
                user.getEmail(), request.getTitle(), request.getClient());

        try {
            // In a real implementation, you would:
            // 1. Validate the case data
            // 2. Create a new case in the database
            // 3. Return the case ID

            String caseId = "Case-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Case created successfully");
            response.put("caseId", caseId);
            response.put("title", request.getTitle());
            response.put("client", request.getClient());
            response.put("createdAt", LocalDateTime.now());
            response.put("createdBy", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error creating case: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error creating case");
        }
    }

    @PostMapping("/briefs")
    public ResponseEntity<Map<String, Object>> submitLegalBrief(
            @Valid @RequestBody SubmitBriefRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Legal brief submitted by lawyer {}: Case ID: {}",
                user.getEmail(), request.getCaseId());

        try {
            // In a real implementation, you would:
            // 1. Validate the brief data
            // 2. Store the brief
            // 3. Update the case status

            String briefId = "BRF-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Legal brief submitted successfully");
            response.put("briefId", briefId);
            response.put("caseId", request.getCaseId());
            response.put("title", request.getTitle());
            response.put("submittedAt", LocalDateTime.now());
            response.put("submittedBy", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error submitting legal brief: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error submitting legal brief");
        }
    }

    @GetMapping("/export/{reportId}")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportId,
            @RequestParam(required = false, defaultValue = "PDF") String format,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Report export requested by lawyer {}: Report ID: {}, Format: {}",
                user.getEmail(), reportId, format);

        try {
            // In a real implementation, you would:
            // 1. Fetch the report from the Report service
            // 2. Convert it to the requested format
            // 3. Return the file

            // Dummy content
            String content = "This is a sample report content for Report ID: " + reportId;
            byte[] fileContent = content.getBytes();

            HttpHeaders headers = new HttpHeaders();

            if ("PDF".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", "report-" + reportId + ".pdf");
            } else if ("DOCX".equalsIgnoreCase(format)) {
                headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
                headers.setContentDispositionFormData("attachment", "report-" + reportId + ".docx");
            } else {
                headers.setContentType(MediaType.TEXT_PLAIN);
                headers.setContentDispositionFormData("attachment", "report-" + reportId + ".txt");
            }

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error exporting report: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error exporting report");
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> getReports(
            @RequestParam(required = false) String caseId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Reports list requested by lawyer {}: Case ID: {}",
                user.getEmail(), caseId);

        try {
            // In a real implementation, you would fetch reports from the Report service
            List<Map<String, Object>> reports = new ArrayList<>();

            for (int i = 1; i <= 5; i++) {
                Map<String, Object> report = new HashMap<>();
                report.put("reportId", "RPT-" + (1000 + i));
                report.put("caseId", caseId != null ? caseId : "Case-" + (200 + i % 3));
                report.put("title", "Image Analysis Report #" + i);
                report.put("createdAt", LocalDateTime.now().minusDays(i * 2));
                report.put("createdBy", "Expert User");
                report.put("status", "FINAL");
                report.put("type", "EXPERT_ANALYSIS");

                reports.add(report);
            }

            // Filter by case ID if provided
            if (caseId != null && !caseId.isEmpty()) {
                reports = reports.stream()
                        .filter(r -> caseId.equals(r.get("caseId")))
                        .toList();
            }

            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            logger.error("Error retrieving reports: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving reports");
        }
    }

    // Helper methods

    private String getRandomCaseStatus() {
        String[] statuses = {"ACTIVE", "PENDING_COURT", "PENDING_REVIEW", "CLOSED", "ARCHIVED"};
        return statuses[new Random().nextInt(statuses.length)];
    }

    // Request/Response classes

    @Data
    public static class CreateCaseRequest {
        @NotBlank(message = "Case title is required")
        private String title;

        @NotBlank(message = "Client name is required")
        private String client;

        private String description;

        private LocalDateTime courtDate;

        private String courtLocation;

        private String opposingCounsel;
    }

    @Data
    public static class SubmitBriefRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;

        @NotBlank(message = "Brief title is required")
        private String title;

        @NotBlank(message = "Brief content is required")
        private String content;

        private List<String> evidenceIds;

        private List<String> legalArguments;
    }
}
