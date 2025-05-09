package com.pcd.report.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTemplateDTO {
    private String id;
    private String name;
    private String description;
    private String content;
    private String category;
    private Map<String, Object> metadata; // Keep flexible, maybe define specific fields later
}