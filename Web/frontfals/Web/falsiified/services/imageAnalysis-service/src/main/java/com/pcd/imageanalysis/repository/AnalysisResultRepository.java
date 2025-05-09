package com.pcd.imageanalysis.repository;

import com.pcd.imageanalysis.model.AnalysisResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisResultRepository extends MongoRepository<AnalysisResult, String> {

    @Query(value = "{'imageId': ?0}", sort = "{'analysisTimestamp': -1}")
    List<AnalysisResult> findByImageId(String imageId);

    List<AnalysisResult> findByImageIdIn(List<String> imageIds);

    List<AnalysisResult> findByCaseId(String caseId);

    List<AnalysisResult> findByIsFalsified(Boolean isFalsified);

    @Query("{'confidenceScore': {$gte: ?0}}")
    List<AnalysisResult> findByConfidenceScoreGreaterThan(Double threshold);

    List<AnalysisResult> findByAnalysisStatus(String status);
}