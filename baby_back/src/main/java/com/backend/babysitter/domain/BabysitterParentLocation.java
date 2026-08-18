package com.backend.babysitter.domain;

import java.math.BigDecimal;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterParentLocation {

    private String email;

    private String region;

    private BigDecimal latitude;

    private BigDecimal longitude;

    public void changeRegion(String region, BigDecimal latitude, BigDecimal longitude) {
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
