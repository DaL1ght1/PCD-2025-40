package com.pcd.report.repository;

import com.pcd.report.model.DocumentComment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCommentRepository extends MongoRepository<DocumentComment, String> {
    List<DocumentComment> findByDocumentIdOrderByCreatedAtDesc(String documentId);
}