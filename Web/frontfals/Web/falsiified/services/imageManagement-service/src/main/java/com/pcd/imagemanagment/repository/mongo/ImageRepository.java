package com.pcd.imagemanagment.repository.mongo;

import com.pcd.imagemanagment.model.Image;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;


import java.time.Instant;
import java.util.List;

@Repository
public interface ImageRepository extends MongoRepository<Image, String> {

    List<Image> findByCaseId(String caseId);

    List<Image> findByUploadedBy(String uploaderId);

    @Query("{'analysisStatus': ?0}")
    List<Image> findByAnalysisStatus(String status);

    @Query("{'metadata.captureDate': {$gte: ?0, $lte: ?1}}")
    List<Image> findByCaptureDate(Instant from, Instant to);

    @Query("{'caseId': ?0, 'analysisStatus': ?1}")
    List<Image> findByCaseIdAndStatus(String caseId, String status);

    List<Image> findByFilenameContainingIgnoreCase(String name);
}