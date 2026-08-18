package com.backend.babysitter.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.backend.babysitter.domain.BabysitterJobStatus;
import com.backend.babysitter.domain.TimeSlotType;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterJobPostDTO {

    private Long jobNo;

    private String parentEmail;

    private String parentNickname;

    private String title;

    private String region;

    private Double latitude;

    private Double longitude;

    // /nearby 조회 시에만 채워짐 - 기준 좌표로부터 거리(km)
    private Double distanceKm;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate desiredDate;

    private TimeSlotType timeSlot;

    private Integer hourlyRate;

    private String message;

    private BabysitterJobStatus status;

    private long applicationCount;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
