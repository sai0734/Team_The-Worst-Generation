package com.backend.walk.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalkTrailDTO {

    private Long trailNo;

    private String name;

    private String description;

    private String locationName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    // 내 주변 조회 시에만 채워짐 - 기준 좌표로부터 거리(km)
    private Double distanceKm;

    private LocalDateTime regTime;
}