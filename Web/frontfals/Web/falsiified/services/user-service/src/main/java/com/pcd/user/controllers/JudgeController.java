package com.pcd.user.controllers;

import com.pcd.user.model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/judge")
@RequiredArgsConstructor

public class JudgeController {

    private static final Logger logger = LoggerFactory.getLogger(JudgeController.class);

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getJudgeDashboard(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        logger.info("Judge dashboard accessed by: {}", user.getEmail());

        try {
            Map<String, Object> response = new HashMap<>();
            response.put("user", user.getUsername());
            response.put("role", "JUDGE");
            response.put("permissions", user.getAuthorities());

            // Recent activity
            List<Map<String, Object>> recentActivity = new ArrayList<>();
            Map<String, Object> activity1 = new HashMap<>();
            activity1.put("type", "RULING_ISSUED");
            activity1.put("caseId", "Case-501");
            activity1.put("timestamp", LocalDateTime.now().minusDays(1));
            activity1.put("details", "Issued ruling on evidence admissibility");

            Map<String, Object> activity2 = new HashMap<>();
            activity2.put("type", "CASE_REVIEWED");
            activity2.put("caseId", "Case-502");
            activity2.put("timestamp", LocalDateTime.now().minusHours(5));
            activity2.put("details", "Reviewed case files and expert reports");

            recentActivity.add(activity1);
            recentActivity.add(activity2);
            response.put("recentActivity", recentActivity);

            // Case statistics
            Map<String, Object> caseStats = new HashMap<>();
            caseStats.put("totalCases", 25);
            caseStats.put("pendingReview", 8);
            caseStats.put("scheduledHearings", 5);
            caseStats.put("rulingsPending", 3);
            caseStats.put("completed", 9);
            response.put("caseStatistics", caseStats);

            // Upcoming hearings
            List<Map<String, Object>> upcomingHearings = new ArrayList<>();
            Map<String, Object> hearing1 = new HashMap<>();
            hearing1.put("caseId", "Case-501");
            hearing1.put("title", "Smith v. Johnson");
            hearing1.put("hearingDate", LocalDateTime.now().plusDays(2));
            hearing1.put("location", "Courtroom 305");
            hearing1.put("type", "EVIDENCE_HEARING");

            Map<String, Object> hearing2 = new HashMap<>();
            hearing2.put("caseId", "Case-503");
            hearing2.put("title", "State v. Williams");
            hearing2.put("hearingDate", LocalDateTime.now().plusDays(5));
            hearing2.put("location", "Courtroom 201");
            hearing2.put("type", "TRIAL");

            upcomingHearings.add(hearing1);
            upcomingHearings.add(hearing2);
            response.put("upcomingHearings", upcomingHearings);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error retrieving judge dashboard for user {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving dashboard data");
        }
    }

    @GetMapping("/cases")
    public ResponseEntity<Page<Map<String, Object>>> getJudgeCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "hearingDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Cases list requested by judge {}: page={}, size={}, sortBy={}, sortDir={}, status={}, search={}",
                user.getEmail(), page, size, sortBy, sortDir, status, search);

        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // In a real implementation, you would fetch cases from a database
            List<Map<String, Object>> cases = new ArrayList<>();

            for (int i = 0; i < 25; i++) {
                Map<String, Object> caseData = new HashMap<>();
                caseData.put("caseId", "Case-" + (500 + i));
                caseData.put("title", "Legal Case #" + (500 + i));
                caseData.put("status", getRandomCaseStatus());
                caseData.put("createdAt", LocalDateTime.now().minusDays(i + 10));
                caseData.put("hearingDate", LocalDateTime.now().plusDays((i % 15) + 1));
                caseData.put("plaintiff", "Plaintiff " + (char)('A' + (i % 8)));
                caseData.put("defendant", "Defendant " + (char)('A' + (i % 8)));
                caseData.put("courtroom", "Courtroom " + (200 + (i % 5)));
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
                                ((String) c.get("caseId")).toLowerCase().contains(search.toLowerCase()) ||
                                ((String) c.get("plaintiff")).toLowerCase().contains(search.toLowerCase()) ||
                                ((String) c.get("defendant")).toLowerCase().contains(search.toLowerCase()))
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
            logger.error("Error retrieving cases for judge {}: {}", user.getEmail(), e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving cases");
        }
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<Map<String, Object>> getCaseDetails(
            @PathVariable String caseId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case details requested by judge {}: Case ID: {}",
                user.getEmail(), caseId);

        try {
            // In a real implementation, you would fetch case details from a database
            Map<String, Object> caseDetails = new HashMap<>();
            caseDetails.put("caseId", caseId);
            caseDetails.put("title", "Legal Case #" + caseId);
            caseDetails.put("description", "Case involving potential falsified evidence in contract dispute.");
            caseDetails.put("status", "PENDING_REVIEW");
            caseDetails.put("createdAt", LocalDateTime.now().minusDays(20));
            caseDetails.put("hearingDate", LocalDateTime.now().plusDays(5));
            caseDetails.put("plaintiff", "Plaintiff A");
            caseDetails.put("defendant", "Defendant B");
            caseDetails.put("plaintiffCounsel", "Law Firm X");
            caseDetails.put("defenseCounsel", "Law Firm Y");
            caseDetails.put("courtroom", "Courtroom 305");
            caseDetails.put("evidenceCount", 12);

            // Case timeline
            List<Map<String, Object>> timeline = new ArrayList<>();
            Map<String, Object> event1 = new HashMap<>();
            event1.put("eventType", "CASE_FILED");
            event1.put("timestamp", LocalDateTime.now().minusDays(20));
            event1.put("user", "Lawyer User");
            event1.put("details", "Case filed with court");

            Map<String, Object> event2 = new HashMap<>();
            event2.put("eventType", "EVIDENCE_SUBMITTED");
            event2.put("timestamp", LocalDateTime.now().minusDays(15));
            event2.put("user", "Lawyer User");
            event2.put("details", "Initial evidence submitted (8 items)");

            Map<String, Object> event3 = new HashMap<>();
            event3.put("eventType", "EXPERT_REPORT_SUBMITTED");
            event3.put("timestamp", LocalDateTime.now().minusDays(10));
            event3.put("user", "Expert User");
            event3.put("details", "Expert analysis report submitted");

            Map<String, Object> event4 = new HashMap<>();
            event4.put("eventType", "HEARING_SCHEDULED");
            event4.put("timestamp", LocalDateTime.now().minusDays(5));
            event4.put("user", user.getUsername());
            event4.put("details", "Hearing scheduled for evidence review");

            timeline.add(event1);
            timeline.add(event2);
            timeline.add(event3);
            timeline.add(event4);
            caseDetails.put("timeline", timeline);

            // Evidence items
            List<Map<String, Object>> evidence = new ArrayList<>();
            for (int i = 1; i <= 12; i++) {
                Map<String, Object> item = new HashMap<>();
                item.put("evidenceId", "EVD-" + caseId + "-" + i);
                item.put("type", i <= 8 ? "IMAGE" : "DOCUMENT");
                item.put("filename", "evidence_" + i + (i <= 8 ? ".jpg" : ".pdf"));
                item.put("submittedAt", LocalDateTime.now().minusDays(15).plusHours(i));
                item.put("submittedBy", "Lawyer User");
                item.put("analysisStatus", i <= 10 ? "COMPLETED" : "PENDING");
                item.put("isFalsified", i == 2 || i == 3 || i == 7);

                evidence.add(item);
            }
            caseDetails.put("evidence", evidence);

            // Legal documents
            List<Map<String, Object>> documents = new ArrayList<>();
            Map<String, Object> doc1 = new HashMap<>();
            doc1.put("documentId", "DOC-" + caseId + "-1");
            doc1.put("type", "COMPLAINT");
            doc1.put("title", "Initial Complaint");
            doc1.put("submittedAt", LocalDateTime.now().minusDays(20));
            doc1.put("submittedBy", "Lawyer User");

            Map<String, Object> doc2 = new HashMap<>();
            doc2.put("documentId", "DOC-" + caseId + "-2");
            doc2.put("type", "EXPERT_REPORT");
            doc2.put("title", "Expert Analysis Report");
            doc2.put("submittedAt", LocalDateTime.now().minusDays(10));
            doc2.put("submittedBy", "Expert User");

            Map<String, Object> doc3 = new HashMap<>();
            doc3.put("documentId", "DOC-" + caseId + "-3");
            doc3.put("type", "LEGAL_BRIEF");
            doc3.put("title", "Legal Arguments Brief");
            doc3.put("submittedAt", LocalDateTime.now().minusDays(8));
            doc3.put("submittedBy", "Lawyer User");

            documents.add(doc1);
            documents.add(doc2);
            documents.add(doc3);
            caseDetails.put("legalDocuments", documents);

            return ResponseEntity.ok(caseDetails);
        } catch (Exception e) {
            logger.error("Error retrieving case details for Case ID {}: {}", caseId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving case details");
        }
    }

    @GetMapping("/reports/{reportId}")
    public ResponseEntity<Map<String, Object>> getReportDetails(
            @PathVariable String reportId,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Report details requested by judge {}: Report ID: {}",
                user.getEmail(), reportId);

        try {
            // In a real implementation, you would fetch report details from the Report service
            Map<String, Object> reportDetails = new HashMap<>();
            reportDetails.put("reportId", reportId);
            reportDetails.put("caseId", "Case-" + (500 + (reportId.hashCode() % 25)));
            reportDetails.put("title", "Image Falsification Analysis Report");
            reportDetails.put("createdAt", LocalDateTime.now().minusDays(10));
            reportDetails.put("expertId", "Expert-001");
            reportDetails.put("expertName", "Dr. John Smith");

            // Analysis results
            reportDetails.put("isFalsified", true);
            reportDetails.put("confidenceScore", 0.95);
            reportDetails.put("detectedManipulations", List.of("SPLICING", "COPY_MOVE", "OBJECT_REMOVAL"));

            // Detailed findings
            List<Map<String, Object>> findings = new ArrayList<>();
            Map<String, Object> finding1 = new HashMap<>();
            finding1.put("type", "SPLICING");
            finding1.put("description", "Image contains elements from multiple sources spliced together");
            finding1.put("confidenceScore", 0.97);
            finding1.put("location", "Upper right quadrant");
            finding1.put("techniquesUsed", List.of("DEEP_LEARNING", "ELA"));

            Map<String, Object> finding2 = new HashMap<>();
            finding2.put("type", "COPY_MOVE");
            finding2.put("description", "Elements within the image have been duplicated and moved");
            finding2.put("confidenceScore", 0.94);
            finding2.put("location", "Lower left section");
            finding2.put("techniquesUsed", List.of("SIFT", "DEEP_LEARNING"));

            Map<String, Object> finding3 = new HashMap<>();
            finding3.put("type", "OBJECT_REMOVAL");
            finding3.put("description", "Objects have been removed and filled with inpainting");
            finding3.put("confidenceScore", 0.91);
            finding3.put("location", "Center of image");
            finding3.put("techniquesUsed", List.of("NOISE_ANALYSIS", "DEEP_LEARNING"));

            findings.add(finding1);
            findings.add(finding2);
            findings.add(finding3);
            reportDetails.put("findings", findings);

            // Expert conclusion
            reportDetails.put("conclusion", "Based on multiple detection techniques and analysis methods, this image shows clear evidence of intentional manipulation. The manipulations appear to be sophisticated but detectable with advanced forensic techniques.");

            // Recommendations
            reportDetails.put("recommendations", "This image should not be considered as authentic evidence. Further investigation into the source of the manipulation is recommended.");

            return ResponseEntity.ok(reportDetails);
        } catch (Exception e) {
            logger.error("Error retrieving report details for Report ID {}: {}", reportId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving report details");
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getCaseHistory(
            @RequestParam(required = false) String caseId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String actionType,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case history requested by judge {}: Case ID: {}, User ID: {}, Action Type: {}, Limit: {}",
                user.getEmail(), caseId, userId, actionType, limit);

        try {
            // In a real implementation, you would fetch case history from a database
            List<Map<String, Object>> history = new ArrayList<>();

            for (int i = 0; i < 100; i++) {
                Map<String, Object> event = new HashMap<>();
                event.put("eventId", "EVT-" + (1000 + i));
                event.put("caseId", "Case-" + (500 + (i % 25)));
                event.put("action", getRandomActionType());
                event.put("timestamp", LocalDateTime.now().minusDays(i / 5).minusHours(i % 24));
                event.put("userId", "User-" + (100 + (i % 10)));
                event.put("userRole", getRandomUserRole());
                event.put("details", "Action details for event #" + i);
                event.put("ipAddress", "192.168.1." + (i % 255));

                history.add(event);
            }

            // Filter by case ID if provided
            if (caseId != null && !caseId.isEmpty()) {
                history = history.stream()
                        .filter(e -> caseId.equals(e.get("caseId")))
                        .toList();
            }

            // Filter by user ID if provided
            if (userId != null && !userId.isEmpty()) {
                history = history.stream()
                        .filter(e -> userId.equals(e.get("userId")))
                        .toList();
            }

            // Filter by action type if provided
            if (actionType != null && !actionType.isEmpty()) {
                history = history.stream()
                        .filter(e -> actionType.equals(e.get("action")))
                        .toList();
            }

            // Limit the results
            if (history.size() > limit) {
                history = history.subList(0, limit);
            }

            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error retrieving case history: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error retrieving case history");
        }
    }

    @PostMapping("/ruling")
    public ResponseEntity<Map<String, Object>> submitRuling(
            @Valid @RequestBody SubmitRulingRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Ruling submitted by judge {}: Case ID: {}",
                user.getEmail(), request.getCaseId());

        try {
            // In a real implementation, you would:
            // 1. Validate the ruling data
            // 2. Store the ruling
            // 3. Update the case status

            String rulingId = "RUL-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Ruling submitted successfully");
            response.put("rulingId", rulingId);
            response.put("caseId", request.getCaseId());
            response.put("title", request.getTitle());
            response.put("submittedAt", LocalDateTime.now());
            response.put("submittedBy", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error submitting ruling: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error submitting ruling");
        }
    }

    @PutMapping("/cases/{caseId}/status")
    public ResponseEntity<Map<String, Object>> updateCaseStatus(
            @PathVariable String caseId,
            @Valid @RequestBody UpdateCaseStatusRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Case status update requested by judge {}: Case ID: {}, New Status: {}",
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
            response.put("previousStatus", "PENDING_REVIEW");
            response.put("newStatus", request.getStatus());
            response.put("updatedAt", LocalDateTime.now());
            response.put("updatedBy", user.getUsername());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating case status: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating case status");
        }
    }

    @PostMapping("/hearings")
    public ResponseEntity<Map<String, Object>> scheduleHearing(
            @Valid @RequestBody ScheduleHearingRequest request,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        logger.info("Hearing scheduling requested by judge {}: Case ID: {}, Date: {}",
                user.getEmail(), request.getCaseId(), request.getHearingDate());

        try {
            // In a real implementation, you would:
            // 1. Validate the hearing data
            // 2. Schedule the hearing in the database
            // 3. Update the case status

            String hearingId = "HRG-" + System.currentTimeMillis();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Hearing scheduled successfully");
            response.put("hearingId", hearingId);
            response.put("caseId", request.getCaseId());
            response.put("hearingDate", request.getHearingDate());
            response.put("hearingType", request.getHearingType());
            response.put("location", request.getLocation());
            response.put("scheduledAt", LocalDateTime.now());
            response.put("scheduledBy", user.getUsername());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error scheduling hearing: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error scheduling hearing");
        }
    }

    // Helper methods

    private String getRandomCaseStatus() {
        String[] statuses = {"PENDING_REVIEW", "SCHEDULED_HEARING", "UNDER_DELIBERATION", "RULING_ISSUED", "CLOSED"};
        return statuses[new Random().nextInt(statuses.length)];
    }

    private String getRandomActionType() {
        String[] actions = {"CASE_CREATED", "EVIDENCE_SUBMITTED", "REPORT_SUBMITTED", "HEARING_SCHEDULED", "RULING_ISSUED", "STATUS_CHANGED", "DOCUMENT_VIEWED"};
        return actions[new Random().nextInt(actions.length)];
    }

    private String getRandomUserRole() {
        String[] roles = {"ADMIN", "LAWYER", "INVESTIGATOR", "EXPERT", "JUDGE"};
        return roles[new Random().nextInt(roles.length)];
    }

    // Request/Response classes

    @Data
    public static class SubmitRulingRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;

        @NotBlank(message = "Ruling title is required")
        private String title;

        @NotBlank(message = "Ruling content is required")
        private String content;

        private String decision;

        private List<String> findings;

        private List<String> legalReferences;
    }

    @Data
    public static class UpdateCaseStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;

        private String reason;
    }

    @Data
    public static class ScheduleHearingRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;

        @NotNull(message = "Hearing date is required")
        private LocalDateTime hearingDate;

        @NotBlank(message = "Hearing type is required")
        private String hearingType;

        @NotBlank(message = "Location is required")
        private String location;

        private String description;

        private List<String> participants;
    }
}
