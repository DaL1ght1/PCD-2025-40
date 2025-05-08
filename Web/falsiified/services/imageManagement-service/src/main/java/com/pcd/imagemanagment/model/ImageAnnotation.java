package com.pcd.imagemanagment.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.UUID;

@Document(collection = "image_annotations")
@Getter
@Setter
public class ImageAnnotation {
    @Id
    private String id;
    private String imageId;
    private String content;
    private String createdBy;
    private Date createdAt;
    private String type;
    private Coordinates coordinates;

    public ImageAnnotation() {
        this.id = UUID.randomUUID().toString();
    }
}