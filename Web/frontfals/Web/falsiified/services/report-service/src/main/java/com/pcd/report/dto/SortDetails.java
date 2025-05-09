package com.pcd.report.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SortDetails {
    private boolean sorted;
    private boolean unsorted;
    private boolean empty;}