package com.backend.health.domain;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class BabySkinCheck {

    private Long checkNo; // pk
    private Long babyNo; // fk
    private String imageFileName;
    private String aiResult;
    private LocalDateTime regTime;
}