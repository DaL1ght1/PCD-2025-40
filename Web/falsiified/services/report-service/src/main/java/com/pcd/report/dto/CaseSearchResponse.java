package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseSearchResponse {
    private List<CaseDTO> cases;
    private long totalElements;
    private int totalPages;
    private int currentPage;
}
