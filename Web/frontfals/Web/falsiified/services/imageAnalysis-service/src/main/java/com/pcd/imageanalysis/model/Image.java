package com.pcd.imageanalysis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Image {
    private String id;
    private String originalFilename;
    private String contentType;
    private long fileSize;
    private int width;
    private int height;
    private String caseId;
    private String uploaderId;
    private String uploaderRole;
    private Instant uploadTimestamp;
    private String sha256Hash;
    private String gridFsFileId;
    private ImageMetadata metadata;
    private List<CustodyEvent> custodyTrail = new ArrayList<>();
    private String analysisStatus;
}





