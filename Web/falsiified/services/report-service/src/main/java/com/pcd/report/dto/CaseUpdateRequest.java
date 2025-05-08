package com.pcd.report.dto;

import com.pcd.report.model.CaseStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseUpdateRequest {
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private CaseStatus status;
    private String assignedExpertId;
    private Set<String> imageIds;
    private Set<String> analysisIds;
    private String verdict;

    @Size(max = 2000, message = "Judicial notes cannot exceed 2000 characters")
    private String judicialNotes;
}
