package com.pcd.report.service;

import com.pcd.report.dto.*;
import com.pcd.report.exception.CaseNotFoundException;
import com.pcd.report.exception.InvalidCaseStateException;
import com.pcd.report.model.Case;
import com.pcd.report.model.CaseStatus;
import com.pcd.report.repository.CaseRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private final CaseRepository caseRepository;
    private final AnalysisService analysisService;
    private final CaseMapper caseMapper;

    public CaseDTO createCase(CaseCreationRequest request) {
        log.info("Creating new case with title: {}", request.getTitle());

        Case newCase = Case.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .investigatorId(request.getInvestigatorId())
                .imageIds(request.getImageIds())
                .status(CaseStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        newCase.generateCaseNumberIfMissing();
        Case savedCase = caseRepository.save(newCase);
        log.info("Case created successfully with ID: {} and case number: {}",
                savedCase.getId(), savedCase.getCaseNumber());

        return caseMapper.toDto(savedCase);
    }

    public CaseDTO getCaseById(String id) {
        log.debug("Fetching case with ID: {}", id);
        Case caseEntity = findCaseById(id);
        return caseMapper.toDto(caseEntity);
    }

    public CaseDTO getCaseByCaseNumber(String caseNumber) {
        log.debug("Fetching case with case number: {}", caseNumber);
        Case caseEntity = caseRepository.findByCaseNumber(caseNumber)
                .orElseThrow(() -> new CaseNotFoundException("Case not found with case number: " + caseNumber));
        return caseMapper.toDto(caseEntity);
    }

    public CaseDTO updateCase(String id, CaseUpdateRequest request) {
        log.info("Updating case with ID: {}", id);
        Case existingCase = findCaseById(id);

        // Update fields if provided in the request
        if (request.getTitle() != null) {
            existingCase.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            existingCase.setDescription(request.getDescription());
        }

        if (request.getStatus() != null) {
            validateStatusTransition(existingCase.getStatus(), request.getStatus());
            existingCase.setStatus(request.getStatus());

            // If case is being closed, set the closed date
            if (request.getStatus() == CaseStatus.COMPLETED ||
                    request.getStatus() == CaseStatus.REJECTED ||
                    request.getStatus() == CaseStatus.ARCHIVED) {
                existingCase.setClosedAt(LocalDateTime.now());
            }
        }

        if (request.getAssignedExpertId() != null) {
            existingCase.setAssignedExpertId(request.getAssignedExpertId());

            // If an expert is assigned, update status if it's still PENDING
            if (existingCase.getStatus() == CaseStatus.PENDING) {
                existingCase.setStatus(CaseStatus.ASSIGNED);
            }
        }

        if (request.getImageIds() != null) {
            existingCase.getImageIds().addAll(request.getImageIds());
        }

        if (request.getAnalysisIds() != null) {
            existingCase.getAnalysisIds().addAll(request.getAnalysisIds());
        }

        if (request.getVerdict() != null) {
            existingCase.setVerdict(request.getVerdict());
        }

        if (request.getJudicialNotes() != null) {
            existingCase.setJudicialNotes(request.getJudicialNotes());
        }

        Case updatedCase = caseRepository.save(existingCase);
        log.info("Case updated successfully: {}", updatedCase.getId());

        return caseMapper.toDto(updatedCase);
    }

    public void deleteCase(String id) {
        log.info("Deleting case with ID: {}", id);
        Case caseEntity = findCaseById(id);

        // Instead of hard delete, consider archiving
        caseEntity.setStatus(CaseStatus.ARCHIVED);
        caseEntity.setClosedAt(LocalDateTime.now());
        caseRepository.save(caseEntity);

        log.info("Case archived successfully: {}", id);
    }

    public CaseSearchResponse searchCases(
            String title,
            CaseStatus status,
            String investigatorId,
            String expertId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size,
            String sortBy,
            String sortDirection) {

        log.debug("Searching cases with filters: title={}, status={}, investigatorId={}, expertId={}",
                title, status, investigatorId, expertId);

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Case> casesPage = caseRepository.searchCases(
                title, status, investigatorId, expertId, startDate, endDate, pageable);

        List<CaseDTO> caseDTOs = casesPage.getContent().stream()
                .map(caseMapper::toDto)
                .collect(Collectors.toList());

        return CaseSearchResponse.builder()
                .cases(caseDTOs)
                .totalElements(casesPage.getTotalElements())
                .totalPages(casesPage.getTotalPages())
                .currentPage(casesPage.getNumber())
                .build();
    }

    public List<CaseDTO> getCasesByInvestigator(String investigatorId, int page, int size) {
        log.debug("Fetching cases for investigator: {}", investigatorId);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Case> casesPage = caseRepository.findByInvestigatorId(investigatorId, pageable);

        return casesPage.getContent().stream()
                .map(caseMapper::toDto)
                .collect(Collectors.toList());
    }

    public Page<CaseDTO> getCasesByExpert(String expertId, int page, int size) {
        log.debug("Fetching cases for expert: {}", expertId);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Case> casesPage = caseRepository.findByAssignedExpertId(expertId, pageable);

        return casesPage.map(caseMapper::toDto);
    }

    public CaseDTO assignExpert(String caseId, String expertId) {
        log.info("Assigning expert {} to case {}", expertId, caseId);
        Case caseEntity = findCaseById(caseId);

        if (caseEntity.getStatus() != CaseStatus.PENDING) {
            throw new InvalidCaseStateException("Can only assign experts to cases in PENDING status");
        }

        caseEntity.setAssignedExpertId(expertId);
        caseEntity.setStatus(CaseStatus.ASSIGNED);

        Case updatedCase = caseRepository.save(caseEntity);
        log.info("Expert assigned successfully to case: {}", caseId);

        return caseMapper.toDto(updatedCase);
    }

    public CaseDTO addAnalysisToCase(String caseId, String analysisId) {
        log.info("Adding analysis {} to case {}", analysisId, caseId);
        Case caseEntity = findCaseById(caseId);

        // Verify that the analysis exists
        AnalysisDto analysis = analysisService.getAnalysis(analysisId);
        if (analysis == null) {
            throw new IllegalArgumentException("Analysis not found with ID: " + analysisId);
        }

        caseEntity.getAnalysisIds().add(analysisId);

        // If case is in ASSIGNED status, move it to IN_PROGRESS
        if (caseEntity.getStatus() == CaseStatus.ASSIGNED) {
            caseEntity.setStatus(CaseStatus.IN_PROGRESS);
        }

        Case updatedCase = caseRepository.save(caseEntity);
        log.info("Analysis added successfully to case: {}", caseId);

        return caseMapper.toDto(updatedCase);
    }

    public CaseDTO completeAnalysis(String caseId) {
        log.info("Marking analysis as complete for case {}", caseId);
        Case caseEntity = findCaseById(caseId);

        if (caseEntity.getStatus() != CaseStatus.IN_PROGRESS) {
            throw new InvalidCaseStateException("Can only complete analysis for cases in IN_PROGRESS status");
        }

        caseEntity.setStatus(CaseStatus.ANALYSIS_COMPLETE);
        Case updatedCase = caseRepository.save(caseEntity);
        log.info("Analysis marked as complete for case: {}", caseId);

        return caseMapper.toDto(updatedCase);
    }

    public CaseDTO submitForReview(String caseId) {
        log.info("Submitting case {} for review", caseId);
        Case caseEntity = findCaseById(caseId);

        if (caseEntity.getStatus() != CaseStatus.ANALYSIS_COMPLETE) {
            throw new InvalidCaseStateException("Can only submit for review cases with ANALYSIS_COMPLETE status");
        }

        caseEntity.setStatus(CaseStatus.UNDER_REVIEW);
        Case updatedCase = caseRepository.save(caseEntity);
        log.info("Case submitted for review: {}", caseId);

        return caseMapper.toDto(updatedCase);
    }

    public CaseDTO completeCase(String caseId, String verdict, String judicialNotes) {
        log.info("Completing case {} with verdict", caseId);
        Case caseEntity = findCaseById(caseId);

        if (caseEntity.getStatus() != CaseStatus.UNDER_REVIEW) {
            throw new InvalidCaseStateException("Can only complete cases with UNDER_REVIEW status");
        }

        caseEntity.setStatus(CaseStatus.COMPLETED);
        caseEntity.setVerdict(verdict);
        caseEntity.setJudicialNotes(judicialNotes);
        caseEntity.setClosedAt(LocalDateTime.now());

        Case updatedCase = caseRepository.save(caseEntity);
        log.info("Case completed successfully: {}", caseId);

        return caseMapper.toDto(updatedCase);
    }

    public CaseStatisticsDTO getCaseStatistics() {
        log.debug("Fetching case statistics");

        long totalCases = caseRepository.count();
        long pendingCases = caseRepository.countByStatus(CaseStatus.PENDING);
        long assignedCases = caseRepository.countByStatus(CaseStatus.ASSIGNED);
        long inProgressCases = caseRepository.countByStatus(CaseStatus.IN_PROGRESS);
        long analysisCompleteCases = caseRepository.countByStatus(CaseStatus.ANALYSIS_COMPLETE);
        long underReviewCases = caseRepository.countByStatus(CaseStatus.UNDER_REVIEW);
        long completedCases = caseRepository.countByStatus(CaseStatus.COMPLETED);
        long rejectedCases = caseRepository.countByStatus(CaseStatus.REJECTED);

        return CaseStatisticsDTO.builder()
                .totalCases(totalCases)
                .pendingCases(pendingCases)
                .assignedCases(assignedCases)
                .inProgressCases(inProgressCases)
                .analysisCompleteCases(analysisCompleteCases)
                .underReviewCases(underReviewCases)
                .completedCases(completedCases)
                .rejectedCases(rejectedCases)
                .build();
    }

    private Case findCaseById(String id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new CaseNotFoundException("Case not found with ID: " + id));
    }

    private void validateStatusTransition(CaseStatus currentStatus, CaseStatus newStatus) {
        // Implement state machine logic for valid status transitions
        switch (currentStatus) {
            case PENDING:
                if (newStatus != CaseStatus.ASSIGNED && newStatus != CaseStatus.REJECTED) {
                    throw new InvalidCaseStateException("Invalid status transition from PENDING to " + newStatus);
                }
                break;
            case ASSIGNED:
                if (newStatus != CaseStatus.IN_PROGRESS && newStatus != CaseStatus.REJECTED) {
                    throw new InvalidCaseStateException("Invalid status transition from ASSIGNED to " + newStatus);
                }
                break;
            case IN_PROGRESS:
                if (newStatus != CaseStatus.ANALYSIS_COMPLETE && newStatus != CaseStatus.REJECTED) {
                    throw new InvalidCaseStateException("Invalid status transition from IN_PROGRESS to " + newStatus);
                }
                break;
            case ANALYSIS_COMPLETE:
                if (newStatus != CaseStatus.UNDER_REVIEW && newStatus != CaseStatus.REJECTED) {
                    throw new InvalidCaseStateException("Invalid status transition from ANALYSIS_COMPLETE to " + newStatus);
                }
                break;
            case UNDER_REVIEW:
                if (newStatus != CaseStatus.COMPLETED && newStatus != CaseStatus.REJECTED) {
                    throw new InvalidCaseStateException("Invalid status transition from UNDER_REVIEW to " + newStatus);
                }
                break;
            case COMPLETED:
                if (newStatus != CaseStatus.ARCHIVED) {
                    throw new InvalidCaseStateException("Invalid status transition from COMPLETED to " + newStatus);
                }
                break;
            case REJECTED:
                if (newStatus != CaseStatus.ARCHIVED) {
                    throw new InvalidCaseStateException("Invalid status transition from REJECTED to " + newStatus);
                }
                break;
            case ARCHIVED:
                throw new InvalidCaseStateException("Cannot change status of ARCHIVED cases");
        }
    }

    public CaseDTO submitDecision(String caseId, String verdict, String judicialNotes) {
        log.info("Submitting decision for case ID: {}", caseId);
        return completeCase(caseId, verdict, judicialNotes);
    }

    @Transactional
    public CaseDTO markCaseForReview(String caseId) {
        log.info("Marking case for review: {}", caseId);
        Case c = findCaseById(caseId);
        if (!isValidStatusTransition(c.getStatus(), CaseStatus.UNDER_REVIEW)) {
            log.error("Invalid status transition from {} to UNDER_REVIEW", c.getStatus());
            throw new IllegalStateException("Cannot transition from " + c.getStatus() + " to UNDER_REVIEW");
        }
        c.setStatus(CaseStatus.UNDER_REVIEW);
        Case updatedCase = caseRepository.save(c);
        log.info("Case updated successfully: {}", updatedCase.getId());
        return caseMapper.toDto(updatedCase);
    }

    private boolean isValidStatusTransition(CaseStatus current, CaseStatus requested) {
        if (requested == CaseStatus.UNDER_REVIEW) {
            return current == CaseStatus.PENDING || current == CaseStatus.ASSIGNED;
        }
        return false;
    }

}
