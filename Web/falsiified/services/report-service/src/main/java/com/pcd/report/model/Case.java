package com.pcd.report.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Document(collection = "cases")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Case {

    @Id
    private String id;

    @Indexed(unique = true)
    private String caseNumber;

    @NotBlank
    @Size(min = 3, max = 100)
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull
    private CaseStatus status;

    @NotNull
    private String investigatorId;

    private String assignedExpertId;

    private Set<String> imageIds = new HashSet<>();

    private Set<String> analysisIds = new HashSet<>();

    private String verdict;

    @Size(max = 2000)
    private String judicialNotes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime closedAt;

    // Method to generate case number if not provided
    public void generateCaseNumberIfMissing() {
        if (this.caseNumber == null) {
            this.caseNumber = "CASE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (this.status == null) {
            this.status = CaseStatus.PENDING;
        }
    }
}
