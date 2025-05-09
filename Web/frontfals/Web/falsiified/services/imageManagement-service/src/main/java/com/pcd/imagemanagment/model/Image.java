package com.pcd.imagemanagment.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "images")
public class Image {
    @Id
    private String id;

    private String filename;
    private String contentType;
    private long fileSize;
    private int width;
    private int height;

    @Indexed
    private String caseId;

    @Indexed
    private String uploadedBy;

    private String uploaderRole;

    @CreatedDate
    private LocalDateTime uploadDate;

    private String sha256Hash;

    private String gridFsFileId;

    private ImageMetadata metadata;

    private List<CustodyEvent> custodyTrail = new ArrayList<>();

    // Analysis status tracking
    private String analysisStatus;

    private List<String> tags = new ArrayList<>();
    private List<String> analysisResults = new ArrayList<>();
}