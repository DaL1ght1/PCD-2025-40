package com.pcd.imageanalysis.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ImageMetadata {
    private String deviceMake;
    private String deviceModel;
    private Instant captureDate;
    private GeoLocation location;
    private String software;
    private String colorSpace;
    private Float exposureTime;
    private Float aperture;
    private Integer iso;
    private Boolean flash;
    private String lensModel;
    private Map<String, String> additionalMetadata;
}