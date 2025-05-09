package com.pcd.report.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersionDTO {
    private String id;
    private String documentId;
    private String content;
    private LocalDateTime createdAt;
    private String createdBy;
    private int versionNumber;
    private String comment;
}