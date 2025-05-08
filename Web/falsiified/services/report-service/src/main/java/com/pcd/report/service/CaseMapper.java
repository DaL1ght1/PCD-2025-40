package com.pcd.report.service;

import com.pcd.report.dto.CaseDTO;
import com.pcd.report.dto.CaseUpdateRequest;
import com.pcd.report.model.Case;
import org.springframework.stereotype.Component;

@Component
public class CaseMapper {

    public CaseDTO toDto(Case caseEntity) {
        if (caseEntity == null) {
            return null;
        }

        return CaseDTO.builder()
                .id(caseEntity.getId())
                .caseNumber(caseEntity.getCaseNumber())
                .title(caseEntity.getTitle())
                .description(caseEntity.getDescription())
                .status(caseEntity.getStatus())
                .investigatorId(caseEntity.getInvestigatorId())
                .assignedExpertId(caseEntity.getAssignedExpertId())
                .imageIds(caseEntity.getImageIds())
                .analysisIds(caseEntity.getAnalysisIds())
                .verdict(caseEntity.getVerdict())
                .judicialNotes(caseEntity.getJudicialNotes())
                .createdAt(caseEntity.getCreatedAt())
                .updatedAt(caseEntity.getUpdatedAt())
                .closedAt(caseEntity.getClosedAt())
                .build();
    }

    public Case toEntity(CaseDTO dto) {
        if (dto == null) {
            return null;
        }

        return Case.builder()
                .id(dto.getId())
                .caseNumber(dto.getCaseNumber())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .status(dto.getStatus())
                .investigatorId(dto.getInvestigatorId())
                .assignedExpertId(dto.getAssignedExpertId())
                .imageIds(dto.getImageIds())
                .analysisIds(dto.getAnalysisIds())
                .verdict(dto.getVerdict())
                .judicialNotes(dto.getJudicialNotes())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .closedAt(dto.getClosedAt())
                .build();
    }
    public CaseUpdateRequest toUpdateRequest(Case caseEntity) {
        if (caseEntity == null) {
            return null;
        }

        return CaseUpdateRequest.builder()
                .title(caseEntity.getTitle())
                .description(caseEntity.getDescription())
                .status(caseEntity.getStatus())
                .assignedExpertId(caseEntity.getAssignedExpertId())
                .imageIds(caseEntity.getImageIds())
                .analysisIds(caseEntity.getAnalysisIds())
                .verdict(caseEntity.getVerdict())
                .judicialNotes(caseEntity.getJudicialNotes())
                .build();
    }

    // Update Case entity from CaseUpdateRequest DTO
    public void updateCaseFromRequest(CaseUpdateRequest request, Case caseEntity) {
        if (request == null || caseEntity == null) {
            return;
        }

        if (request.getTitle() != null) {
            caseEntity.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            caseEntity.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            caseEntity.setStatus(request.getStatus());
        }
        if (request.getAssignedExpertId() != null) {
            caseEntity.setAssignedExpertId(request.getAssignedExpertId());
        }
        if (request.getImageIds() != null) {
            caseEntity.setImageIds(request.getImageIds());
        }
        if (request.getAnalysisIds() != null) {
            caseEntity.setAnalysisIds(request.getAnalysisIds());
        }
        if (request.getVerdict() != null) {
            caseEntity.setVerdict(request.getVerdict());
        }
        if (request.getJudicialNotes() != null) {
            caseEntity.setJudicialNotes(request.getJudicialNotes());
        }
    }
}

