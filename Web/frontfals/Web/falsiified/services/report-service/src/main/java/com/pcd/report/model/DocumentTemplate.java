package com.pcd.report.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Map;

@Document(collection = "document_templates")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTemplate {
    @Id
    private String id; // e.g., "nda-standard", "employment-agreement"
    private String name;
    private String description;
    private String content;
    private String category;
    private Map<String, Object> metadata;
}