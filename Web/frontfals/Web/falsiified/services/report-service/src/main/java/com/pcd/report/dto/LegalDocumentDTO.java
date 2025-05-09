package com.pcd.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LegalDocumentDTO {
    private String id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String templateId; // Can be null if not based on a template

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @NotNull(message = "Status is required")
    private DocumentStatus status;

    private List<String> tags;

    @NotBlank(message = "Owner ID is required")
    private String ownerId;

    private List<String> sharedWith;
    private Map<String, Object> metadata;
}