package com.pcd.report.model;

import com.pcd.report.dto.DocumentStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "legal_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalDocument {
    @Id
    private String id;
    private String title;
    private String content;
    private String templateId; // ID of the template used, if any
    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    private DocumentStatus status;
    private List<String> tags;
    private String ownerId;
    private List<String> sharedWith;
    private Map<String, Object> metadata;
}