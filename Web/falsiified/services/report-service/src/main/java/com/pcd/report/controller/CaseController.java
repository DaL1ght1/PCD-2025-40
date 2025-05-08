package com.pcd.report.controller;

import com.pcd.report.dto.*;
import com.pcd.report.model.CaseStatus;
import com.pcd.report.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CaseController {

    private final CaseService caseService;

    @PostMapping
    public ResponseEntity<CaseDTO> createCase(@Valid @RequestBody CaseCreationRequest request) {
        log.info("REST request to create a new case");
        CaseDTO createdCase = caseService.createCase(request);
        return new ResponseEntity<>(createdCase, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
        public ResponseEntity<CaseDTO> getCaseById(@PathVariable String id) {
        log.info("REST request to get case by ID: {}", id);
        CaseDTO caseDTO = caseService.getCaseById(id);
        return ResponseEntity.ok(caseDTO);
    }

    @GetMapping("/number/{caseNumber}")
    public ResponseEntity<CaseDTO> getCaseByCaseNumber(@PathVariable String caseNumber) {
        log.info("REST request to get case by case number: {}", caseNumber);
        CaseDTO caseDTO = caseService.getCaseByCaseNumber(caseNumber);
        return ResponseEntity.ok(caseDTO);
    }

    @PutMapping("/{id}")

    public ResponseEntity<CaseDTO> updateCase(
            @PathVariable String id,
            @Valid @RequestBody CaseUpdateRequest request) {
        log.info("REST request to update case with ID: {}", id);
        CaseDTO updatedCase = caseService.updateCase(id, request);
        return ResponseEntity.ok(updatedCase);
    }

    @DeleteMapping("/{id}")

    public ResponseEntity<Void> deleteCase(@PathVariable String id) {
        log.info("REST request to delete case with ID: {}", id);
        caseService.deleteCase(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")

    public ResponseEntity<CaseSearchResponse> searchCases(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(required = false) String investigatorId,
            @RequestParam(required = false) String expertId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        log.info("REST request to search cases");
        CaseSearchResponse response = caseService.searchCases(
                title, status, investigatorId, expertId, startDate, endDate,
                page, size, sortBy, sortDirection);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/investigator/{investigatorId}")
    public ResponseEntity<List<CaseDTO>> getCasesByInvestigator(
            @PathVariable String investigatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to get cases by investigator ID: {}", investigatorId);
        List<CaseDTO> cases = caseService.getCasesByInvestigator(investigatorId, page, size);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/expert/{expertId}")
    public ResponseEntity<PageResponse<CaseDTO>> getCasesByExpert(
            @PathVariable String expertId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to get cases by expert ID: {}", expertId);
        Page<CaseDTO> casesPage = caseService.getCasesByExpert(expertId, page, size);

        PageResponse<CaseDTO> response = new PageResponse<>(
                casesPage.getContent(),
                casesPage.getNumber(),
                casesPage.getSize(),
                casesPage.getTotalElements(),
                casesPage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/assign-expert/{expertId}")
    public ResponseEntity<CaseDTO> assignExpert(
            @PathVariable String id,
            @PathVariable String expertId) {

        log.info("REST request to assign expert {} to case {}", expertId, id);
        CaseDTO updatedCase = caseService.assignExpert(id, expertId);
        return ResponseEntity.ok(updatedCase);
    }

    @PostMapping("/{id}/add-analysis/{analysisId}")

    public ResponseEntity<CaseDTO> addAnalysisToCase(
            @PathVariable String id,
            @PathVariable String analysisId) {

        log.info("REST request to add analysis {} to case {}", analysisId, id);
        CaseDTO updatedCase = caseService.addAnalysisToCase(id, analysisId);
        return ResponseEntity.ok(updatedCase);
    }

    @PostMapping("/{id}/complete-analysis")

    public ResponseEntity<CaseDTO> completeAnalysis(@PathVariable String id) {
        log.info("REST request to mark analysis as complete for case {}", id);
        CaseDTO updatedCase = caseService.completeAnalysis(id);
        return ResponseEntity.ok(updatedCase);
    }

    @PostMapping("/{id}/submit-for-review")

    public ResponseEntity<CaseDTO> submitForReview(@PathVariable String id) {
        log.info("REST request to submit case {} for review", id);
        CaseDTO updatedCase = caseService.submitForReview(id);
        return ResponseEntity.ok(updatedCase);
    }

    @PostMapping("/{id}/complete")

    public ResponseEntity<CaseDTO> completeCase(
            @PathVariable String id,
            @RequestParam String verdict,
            @RequestParam(required = false) String judicialNotes) {

        log.info("REST request to complete case {} with verdict", id);
        CaseDTO updatedCase = caseService.completeCase(id, verdict, judicialNotes);
        return ResponseEntity.ok(updatedCase);
    }

    @GetMapping("/statistics")

    public ResponseEntity<CaseStatisticsDTO> getCaseStatistics() {
        log.info("REST request to get case statistics");
        CaseStatisticsDTO statistics = caseService.getCaseStatistics();
        return ResponseEntity.ok(statistics);
    }

    @PostMapping("/{id}/decision")
    public ResponseEntity<CaseDTO> submitDecision(
            @PathVariable String id,
            @Valid @RequestBody CaseDecisionRequest request) {
        log.info("REST request to submit decision for case {} with verdict", id);
        CaseDTO updatedCase = caseService.submitDecision(id, request.getVerdict(), request.getJudicialNotes());
        return ResponseEntity.ok(updatedCase);
    }

    @PutMapping("/{id}/markCaseUnder_review")
    public ResponseEntity<CaseDTO> markCaseForReview(@PathVariable String id) {
        log.info("REST request to mark case for review: {}", id);
        CaseDTO caseDTO = caseService.markCaseForReview(id);
        return ResponseEntity.ok(caseDTO);
    }
}
