package com.backend.sleep.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabySleepDTO {

    // PK
    private Long sleepNo;

    // FK
    private Long babyNo;

    private String sleepType;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime regTime;

}