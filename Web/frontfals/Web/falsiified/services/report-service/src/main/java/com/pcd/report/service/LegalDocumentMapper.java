package com.pcd.report.service;

import com.pcd.report.dto.*;
import com.pcd.report.model.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class LegalDocumentMapper {

    // Legal Document Mappings
    public LegalDocumentDTO legalDocumentToDto(LegalDocument entity) {
        if (entity == null) {
            return null;
        }
        LegalDocumentDTO dto = new LegalDocumentDTO();
        // Assuming fields like id, title, content, etc. exist; adjust as per your model
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setContent(entity.getContent());
        // Add other fields as needed
        return dto;
    }

    public LegalDocument dtoToLegalDocument(LegalDocumentDTO dto) {
        if (dto == null) {
            return null;
        }
        LegalDocument entity = new LegalDocument();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setContent(dto.getContent());
        // Add other fields as needed
        return entity;
    }

    public List<LegalDocumentDTO> legalDocumentsToDtos(List<LegalDocument> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::legalDocumentToDto)
                .collect(Collectors.toList());
    }

    // Template Mappings
    public DocumentTemplateDTO templateToDto(DocumentTemplate entity) {
        if (entity == null) {
            return null;
        }
        DocumentTemplateDTO dto = new DocumentTemplateDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        // Add other fields as needed
        return dto;
    }

    public DocumentTemplate dtoToTemplate(DocumentTemplateDTO dto) {
        if (dto == null) {
            return null;
        }
        DocumentTemplate entity = new DocumentTemplate();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        // Add other fields as needed
        return entity;
    }

    public List<DocumentTemplateDTO> templatesToDtos(List<DocumentTemplate> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::templateToDto)
                .collect(Collectors.toList());
    }

    // Version Mappings
    public DocumentVersionDTO versionToDto(DocumentVersion entity) {
        if (entity == null) {
            return null;
        }
        DocumentVersionDTO dto = new DocumentVersionDTO();
        dto.setId(entity.getId());
        dto.setVersionNumber(entity.getVersionNumber());
        // Add other fields as needed
        return dto;
    }

    public DocumentVersion dtoToVersion(DocumentVersionDTO dto) {
        if (dto == null) {
            return null;
        }
        DocumentVersion entity = new DocumentVersion();
        entity.setId(dto.getId());
        entity.setVersionNumber(dto.getVersionNumber());
        // Add other fields as needed
        return entity;
    }

    public List<DocumentVersionDTO> versionsToDtos(List<DocumentVersion> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::versionToDto)
                .collect(Collectors.toList());
    }

    // Comment Mappings
    public DocumentCommentDTO commentToDto(DocumentComment entity) {
        if (entity == null) {
            return null;
        }
        DocumentCommentDTO dto = new DocumentCommentDTO();
        dto.setId(entity.getId());
        dto.setContent(entity.getContent());
        // Add other fields as needed
        return dto;
    }

    public DocumentComment dtoToComment(DocumentCommentDTO dto) {
        if (dto == null) {
            return null;
        }
        DocumentComment entity = new DocumentComment();
        entity.setId(dto.getId());
        entity.setContent(dto.getContent());
        // Add other fields as needed
        return entity;
    }

    public List<DocumentCommentDTO> commentsToDtos(List<DocumentComment> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::commentToDto)
                .collect(Collectors.toList());
    }

    // Position Mappings
    public PositionDTO positionToDto(Position entity) {
        if (entity == null) {
            return null;
        }
        PositionDTO dto = new PositionDTO();
        dto.setStartOffset(entity.getStartOffset());
        dto.setEndOffset(entity.getEndOffset());
        // Add other fields as needed
        return dto;
    }

    public Position dtoToPosition(PositionDTO dto) {
        if (dto == null) {
            return null;
        }
        Position entity = new Position();
        entity.setStartOffset(dto.getStartOffset());
        entity.setEndOffset(dto.getEndOffset());
        // Add other fields as needed
        return entity;
    }
}