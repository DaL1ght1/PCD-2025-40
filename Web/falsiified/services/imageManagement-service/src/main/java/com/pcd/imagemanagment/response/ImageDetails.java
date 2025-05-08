package com.pcd.imagemanagment.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class ImageDetails {
    private String id;
    private String url;
    private String filename;
    private String caseId;
    private String uploadedAt;
}