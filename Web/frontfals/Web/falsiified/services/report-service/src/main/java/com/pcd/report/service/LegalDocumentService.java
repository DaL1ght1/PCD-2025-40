package com.pcd.report.service;

import com.pcd.report.dto.DocumentCommentDTO;
import com.pcd.report.dto.DocumentTemplateDTO;
import com.pcd.report.dto.DocumentVersionDTO;
import com.pcd.report.dto.LegalDocumentDTO;
import com.pcd.report.exception.ResourceNotFoundException;
import com.pcd.report.model.DocumentComment;
import com.pcd.report.model.DocumentTemplate;
import com.pcd.report.model.DocumentVersion;
import com.pcd.report.model.LegalDocument;
import com.pcd.report.repository.DocumentCommentRepository;
import com.pcd.report.repository.DocumentTemplateRepository;
import com.pcd.report.repository.DocumentVersionRepository;
import com.pcd.report.repository.LegalDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException; // Import IOException
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LegalDocumentService {

    private final LegalDocumentRepository documentRepository;
    private final DocumentTemplateRepository templateRepository;
    private final DocumentVersionRepository versionRepository;
    private final DocumentCommentRepository commentRepository;
    private final LegalDocumentMapper mapper;
    private final DocumentExportService exportService; // Inject the export service

    public List<LegalDocumentDTO> getAllDocuments() {
        log.info("Fetching all legal documents");
        return mapper.legalDocumentsToDtos(documentRepository.findAll());
    }

    public List<DocumentTemplateDTO> getAllTemplates() {
        log.info("Fetching all document templates");
        return mapper.templatesToDtos(templateRepository.findAll());
    }

    public DocumentTemplateDTO getTemplateById(String id) { // Added method
        log.info("Fetching template by ID: {}", id);
        DocumentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DocumentTemplate not found with ID: " + id));
        return mapper.templateToDto(template);
    }

    public LegalDocumentDTO getDocumentById(String id) {
        log.info("Fetching legal document by ID: {}", id);
        LegalDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LegalDocument not found with ID: " + id));
        return mapper.legalDocumentToDto(doc);
    }

    @Transactional
    public LegalDocumentDTO createDocument(LegalDocumentDTO documentDto) {
        log.info("Creating new legal document titled: {}", documentDto.getTitle());
        LegalDocument doc = mapper.dtoToLegalDocument(documentDto);
        doc.setId(null);
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());
        LegalDocument savedDoc = documentRepository.save(doc);
        log.info("Legal document created with ID: {}", savedDoc.getId());
        return mapper.legalDocumentToDto(savedDoc);
    }

    @Transactional
    public LegalDocumentDTO updateDocument(String id, LegalDocumentDTO documentDto) {
        log.info("Updating legal document with ID: {}", id);
        LegalDocument existingDoc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LegalDocument not found with ID: " + id));

        existingDoc.setTitle(documentDto.getTitle());
        existingDoc.setContent(documentDto.getContent());
        existingDoc.setTemplateId(documentDto.getTemplateId());
        existingDoc.setStatus(documentDto.getStatus());
        existingDoc.setTags(documentDto.getTags());
        existingDoc.setSharedWith(documentDto.getSharedWith());
        existingDoc.setMetadata(documentDto.getMetadata());
        existingDoc.setUpdatedAt(LocalDateTime.now());

        LegalDocument updatedDoc = documentRepository.save(existingDoc);
        log.info("Legal document updated successfully: {}", updatedDoc.getId());
        return mapper.legalDocumentToDto(updatedDoc);
    }

    @Transactional // Added method
    public DocumentTemplateDTO updateTemplate(String id, DocumentTemplateDTO templateDto) {
        log.info("Updating template with ID: {}", id);
        DocumentTemplate existingTemplate = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DocumentTemplate not found with ID: " + id));

        existingTemplate.setName(templateDto.getName());
        existingTemplate.setDescription(templateDto.getDescription());
        existingTemplate.setContent(templateDto.getContent());
        existingTemplate.setCategory(templateDto.getCategory());
        // Update metadata cautiously, merging might be better
        existingTemplate.setMetadata(templateDto.getMetadata());
        // Set updated timestamp if your model has it

        DocumentTemplate updatedTemplate = templateRepository.save(existingTemplate);
        log.info("Template updated successfully: {}", updatedTemplate.getId());
        return mapper.templateToDto(updatedTemplate);
    }


    @Transactional
    public void deleteDocument(String id) {
        log.warn("Deleting legal document with ID: {}", id);
        if (!documentRepository.existsById(id)) {
            throw new ResourceNotFoundException("LegalDocument not found with ID: " + id);
        }
        versionRepository.deleteAll(versionRepository.findByDocumentIdOrderByVersionNumberDesc(id));
        commentRepository.deleteAll(commentRepository.findByDocumentIdOrderByCreatedAtDesc(id));
        documentRepository.deleteById(id);
        log.info("Legal document deleted successfully: {}", id);
    }

    @Transactional // Added method
    public void deleteTemplate(String id) {
        log.warn("Deleting template with ID: {}", id);
        if (!templateRepository.existsById(id)) {
            throw new ResourceNotFoundException("DocumentTemplate not found with ID: " + id);
        }
        // Add logic here if deleting a template should affect existing documents using it
        templateRepository.deleteById(id);
        log.info("Template deleted successfully: {}", id);
    }


    public Resource exportDocument(String id, String format) {
        log.info("Exporting legal document ID: {} to format: {}", id, format);
        LegalDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LegalDocument not found with ID: " + id));

        byte[] exportedBytes;
        try {
            if ("pdf".equalsIgnoreCase(format)) {
                exportedBytes = exportService.generatePdf(doc.getContent());
            } else if ("docx".equalsIgnoreCase(format)) {
                exportedBytes = exportService.generateDocx(doc.getContent());
            } else {
                throw new IllegalArgumentException("Unsupported export format: " + format);
            }
        } catch (IOException e) {
            log.error("Failed to generate document export for ID: {} format: {}", id, format, e);
            throw new RuntimeException("Failed to export document due to generation error", e);
        } catch (Exception e) {
            log.error("Unexpected error during document export for ID: {} format: {}", id, format, e);
            throw new RuntimeException("Unexpected error during export", e);
        }

        if (exportedBytes == null || exportedBytes.length == 0) {
            log.error("Generated export byte array is null or empty for document ID: {} format: {}", id, format);
            throw new RuntimeException("Failed to export document: generated content is empty");
        }


        return new ByteArrayResource(exportedBytes);
    }

    public List<DocumentVersionDTO> getDocumentVersions(String documentId) {
        log.info("Fetching versions for document ID: {}", documentId);
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("LegalDocument not found with ID: " + documentId);
        }
        List<DocumentVersion> versions = versionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
        return mapper.versionsToDtos(versions);
    }

    public List<DocumentCommentDTO> getDocumentComments(String documentId) {
        log.info("Fetching comments for document ID: {}", documentId);
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("LegalDocument not found with ID: " + documentId);
        }
        List<DocumentComment> comments = commentRepository.findByDocumentIdOrderByCreatedAtDesc(documentId);
        return mapper.commentsToDtos(comments);
    }
}