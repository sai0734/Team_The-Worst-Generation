package com.backend.walk.domain;


import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalkTrail {

    private Long trailNo;

    private String name;

    private String description;

    private String locationName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private LocalDateTime regTime;
}