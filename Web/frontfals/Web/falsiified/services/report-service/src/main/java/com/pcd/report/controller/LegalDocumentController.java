package com.pcd.report.controller;

import com.pcd.report.dto.DocumentCommentDTO;
import com.pcd.report.dto.DocumentTemplateDTO;
import com.pcd.report.dto.DocumentVersionDTO;
import com.pcd.report.dto.LegalDocumentDTO;
import com.pcd.report.exception.ResourceNotFoundException;
import com.pcd.report.service.LegalDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/legal-documents")
@RequiredArgsConstructor
@Slf4j
public class LegalDocumentController {

    private final LegalDocumentService legalDocumentService;

    @GetMapping
    public ResponseEntity<List<LegalDocumentDTO>> getAllDocuments() {
        log.info("GET /api/v1/legal-documents");
        List<LegalDocumentDTO> documents = legalDocumentService.getAllDocuments();
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<DocumentTemplateDTO>> getAllTemplates() {
        log.info("GET /api/v1/legal-documents/templates");
        List<DocumentTemplateDTO> templates = legalDocumentService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/templates/{id}") // Added endpoint to get single template
    public ResponseEntity<DocumentTemplateDTO> getTemplateById(@PathVariable String id) {
        log.info("GET /api/v1/legal-documents/templates/{}", id);
        DocumentTemplateDTO template = legalDocumentService.getTemplateById(id);
        return ResponseEntity.ok(template);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LegalDocumentDTO> getDocumentById(@PathVariable String id) {
        log.info("GET /api/v1/legal-documents/{}", id);
        LegalDocumentDTO document = legalDocumentService.getDocumentById(id);
        return ResponseEntity.ok(document);
    }

    @PostMapping
    public ResponseEntity<LegalDocumentDTO> createDocument(@Valid @RequestBody LegalDocumentDTO documentDto) {
        log.info("POST /api/v1/legal-documents");
        LegalDocumentDTO createdDocument = legalDocumentService.createDocument(documentDto);
        return new ResponseEntity<>(createdDocument, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LegalDocumentDTO> updateDocument(@PathVariable String id, @Valid @RequestBody LegalDocumentDTO documentDto) {
        log.info("PUT /api/v1/legal-documents/{}", id);
        LegalDocumentDTO updatedDocument = legalDocumentService.updateDocument(id, documentDto);
        return ResponseEntity.ok(updatedDocument);
    }

    @PutMapping("/templates/{id}") // Added endpoint to update template
    public ResponseEntity<DocumentTemplateDTO> updateTemplate(@PathVariable String id, @Valid @RequestBody DocumentTemplateDTO templateDto) {
        log.info("PUT /api/v1/legal-documents/templates/{}", id);
        DocumentTemplateDTO updatedTemplate = legalDocumentService.updateTemplate(id, templateDto);
        return ResponseEntity.ok(updatedTemplate);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable String id) {
        log.info("DELETE /api/v1/legal-documents/{}", id);
        legalDocumentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/templates/{id}") // Added endpoint to delete template
    public ResponseEntity<Void> deleteTemplate(@PathVariable String id) {
        log.info("DELETE /api/v1/legal-documents/templates/{}", id);
        legalDocumentService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{id}/export")
    public ResponseEntity<Resource> exportDocument(@PathVariable String id, @RequestParam String format) {
        log.info("GET /api/v1/legal-documents/{}/export?format={}", id, format);
        if (!"pdf".equalsIgnoreCase(format) && !"docx".equalsIgnoreCase(format)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Resource resource = legalDocumentService.exportDocument(id, format.toLowerCase());
            String contentType;
            String filename;

            if ("pdf".equalsIgnoreCase(format)) {
                contentType = MediaType.APPLICATION_PDF_VALUE;
                filename = "document-" + id + ".pdf";
            } else {
                contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                filename = "document-" + id + ".docx";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (ResourceNotFoundException e) {
            log.error("Document not found for export: ID {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error during export for document ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{documentId}/versions")
    public ResponseEntity<List<DocumentVersionDTO>> getDocumentVersions(@PathVariable String documentId) {
        log.info("GET /api/v1/legal-documents/{}/versions", documentId);
        List<DocumentVersionDTO> versions = legalDocumentService.getDocumentVersions(documentId);
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/{documentId}/comments")
    public ResponseEntity<List<DocumentCommentDTO>> getDocumentComments(@PathVariable String documentId) {
        log.info("GET /api/v1/legal-documents/{}/comments", documentId);
        List<DocumentCommentDTO> comments = legalDocumentService.getDocumentComments(documentId);
        return ResponseEntity.ok(comments);
    }
}