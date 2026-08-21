package com.backend.walk.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalkPlaceDTO {
    private String name;
    private String address;
    private double latitude;
    private double longitude;
    private double distanceM;
}