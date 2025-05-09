package com.pcd.report.repository;

import com.pcd.report.model.Case;
import com.pcd.report.model.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends MongoRepository<Case, String>, CaseRepositoryCustom {

    Optional<Case> findByCaseNumber(String caseNumber);

    Page<Case> findByInvestigatorId(String investigatorId, Pageable pageable);

    Page<Case> findByAssignedExpertId(String expertId, Pageable pageable);

    Page<Case> findByStatus(CaseStatus status, Pageable pageable);

    @Query("{'imageIds': ?0}")
    List<Case> findByImageIdsContaining(String imageId);

    @Query("{'analysisIds': ?0}")
    List<Case> findByAnalysisIdsContaining(String analysisId);

    long countByStatus(CaseStatus status);
}
