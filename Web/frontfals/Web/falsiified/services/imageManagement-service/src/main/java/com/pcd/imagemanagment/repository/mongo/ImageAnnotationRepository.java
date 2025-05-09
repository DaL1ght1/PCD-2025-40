package com.pcd.imagemanagment.repository.mongo;

import com.pcd.imagemanagment.model.ImageAnnotation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageAnnotationRepository extends MongoRepository<ImageAnnotation, String> {
    List<ImageAnnotation> findByImageId(String imageId);
}