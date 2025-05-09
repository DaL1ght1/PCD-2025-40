package com.pcd.imagemanagment.response;

import lombok.Data;

@Data
public class ImageUploadResponse {
    private String id;
    private String originalFilename;
    private String contentType;
    private long size;
    private String uploadTimestamp;
    private String CaseId;


}