package com.pcd.report.repository;

import com.pcd.report.model.LegalDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalDocumentRepository extends MongoRepository<LegalDocument, String> {
}