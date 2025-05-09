package com.pcd.report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaginatedResponse<T> {
    private List<T> content;
    private PageableDetails pageable;
    private boolean last;
    private long totalElements;
    private int totalPages;
    private int size;
    private int number;
    private SortDetails sort;
    private boolean first;
    private int numberOfElements;
    private boolean empty;
}