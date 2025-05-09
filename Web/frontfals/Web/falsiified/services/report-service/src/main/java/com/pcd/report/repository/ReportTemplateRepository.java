package com.pcd.report.repository;

import com.pcd.report.model.ReportTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReportTemplateRepository extends MongoRepository<ReportTemplate, String> {

    Optional<ReportTemplate> findByIsDefaultTrue();

    Optional<ReportTemplate> findByName(String name);
    Optional<ReportTemplate> findFirstByIdNot(String id);
}
