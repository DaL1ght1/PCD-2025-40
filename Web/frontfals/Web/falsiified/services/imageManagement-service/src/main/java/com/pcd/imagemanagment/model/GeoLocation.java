package com.pcd.imagemanagment.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoLocation {
    private Double latitude;
    private Double longitude;
    private Double altitude;


}
