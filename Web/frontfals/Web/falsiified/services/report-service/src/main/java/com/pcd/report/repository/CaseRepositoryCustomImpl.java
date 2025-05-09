package com.pcd.report.repository;

import com.pcd.report.model.Case;
import com.pcd.report.model.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public class CaseRepositoryCustomImpl implements CaseRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    public CaseRepositoryCustomImpl(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Page<Case> searchCases(
            String title,
            CaseStatus status,
            String investigatorId,
            String expertId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        Query query = new Query();

        if (title != null && !title.isEmpty()) {
            query.addCriteria(Criteria.where("title").regex(title, "i"));
        }

        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status));
        }

        if (investigatorId != null && !investigatorId.isEmpty()) {
            query.addCriteria(Criteria.where("investigatorId").is(investigatorId));
        }

        if (expertId != null && !expertId.isEmpty()) {
            query.addCriteria(Criteria.where("assignedExpertId").is(expertId));
        }

        if (startDate != null) {
            query.addCriteria(Criteria.where("createdAt").gte(startDate));
        }

        if (endDate != null) {
            query.addCriteria(Criteria.where("createdAt").lte(endDate));
        }

        long total = mongoTemplate.count(query, Case.class);

        query.with(pageable);
        List<Case> cases = mongoTemplate.find(query, Case.class);

        return new PageImpl<>(cases, pageable, total);
    }
}
