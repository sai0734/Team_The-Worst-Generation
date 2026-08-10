package com.backend.sleep.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabySleep {

    // PK
    private Long sleepNo;

    // FK
    private Long babyNo;

    private String sleepType;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private LocalDateTime regTime;

    public void changeSleepType(String sleepType) {
        this.sleepType = sleepType;
    }

    public void changeStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void changeEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

}