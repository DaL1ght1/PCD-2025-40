package com.pcd.report.repository;

import com.pcd.report.model.DocumentTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentTemplateRepository extends MongoRepository<DocumentTemplate, String> {
    Optional<DocumentTemplate> findById(String id);
}