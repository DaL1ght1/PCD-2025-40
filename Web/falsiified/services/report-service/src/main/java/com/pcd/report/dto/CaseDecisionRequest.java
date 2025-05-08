package com.pcd.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CaseDecisionRequest {

    @NotBlank
    @Size(min = 1, max = 100)
    private String verdict;

    @Size(max = 2000)
    private String judicialNotes;
}