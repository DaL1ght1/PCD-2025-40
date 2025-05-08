package com.pcd.report.repository;

import com.pcd.report.model.Case;
import com.pcd.report.model.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface CaseRepositoryCustom {

    Page<Case> searchCases(
            String title,
            CaseStatus status,
            String investigatorId,
            String expertId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable);
}
