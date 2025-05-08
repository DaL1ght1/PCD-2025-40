package com.pcd.imagemanagment.model;

import lombok.Data;

@Data
public class ImageAnnotationRequest {
    private String content;
    private Coordinates coordinates;
    private String type;

}