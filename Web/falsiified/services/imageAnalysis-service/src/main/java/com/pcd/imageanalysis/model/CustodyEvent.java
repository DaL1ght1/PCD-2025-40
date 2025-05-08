package com.pcd.imageanalysis.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustodyEvent {
    private String eventType;
    private String userId;
    private String userRole;
    private Instant timestamp;
    private String details;
    private String ipAddress;
}