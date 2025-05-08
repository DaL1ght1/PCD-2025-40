package com.pcd.report.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public  class PageableDetails {
    private SortDetails sort;
    private int pageNumber;
    private int pageSize;
    private long offset;
    private boolean paged;
    private boolean unpaged;

}