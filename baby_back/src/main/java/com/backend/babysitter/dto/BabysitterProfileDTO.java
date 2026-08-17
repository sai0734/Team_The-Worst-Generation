package com.backend.babysitter.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.backend.babysitter.domain.BabysitterStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterProfileDTO {

    private String email;

    private String name;

    private int careerYears;

    private String region;

    private Double latitude;

    private Double longitude;

    // /nearby 조회 시에만 채워짐 - 기준 좌표로부터 거리(km)
    private Double distanceKm;

    private String availableTime;

    private Integer hourlyRate;

    private String intro;

    private String profileImageFileName;

    private BabysitterStatus status;

    @Builder.Default
    private List<BabysitterAvailabilityDTO> availability = List.of();

    private long pickCount;

    // 부모가 이 시터를 실제로 선정(요청 수락)한 횟수 - gradeLevel 산정 기준
    private long selectionCount;

    // 1~10 (Lv.1 ~ Lv.10)
    private int gradeLevel;

    private Double averageRating;

    private long reviewCount;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
