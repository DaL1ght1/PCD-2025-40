package com.pcd.report.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "document_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersion {
    @Id
    private String id;
    private String documentId; // Reference to the LegalDocument
    private String content;
    @CreatedDate
    private LocalDateTime createdAt;
    private String createdBy;
    private int versionNumber;
    private String comment;
}