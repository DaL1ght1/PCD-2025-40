package com.pcd.report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// Use your existing package structure if different
public enum DocumentStatus {
    @JsonProperty("draft")
    DRAFT,

    @JsonProperty("needs_review")
    NEEDS_REVIEW,

    @JsonProperty("finalized")
    FINALIZED
}