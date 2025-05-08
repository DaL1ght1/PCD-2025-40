package com.pcd.report.repository;

import com.pcd.report.model.DocumentVersion;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentVersionRepository extends MongoRepository<DocumentVersion, String> {
    List<DocumentVersion> findByDocumentIdOrderByVersionNumberDesc(String documentId);
}