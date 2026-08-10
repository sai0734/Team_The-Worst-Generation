package com.backend.vaccination.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabyVaccinationDTO {

    // PK
    private Long vaccinationNo;

    // FK
    private Long babyNo;

    // FK (표준 항목이면 값 있음, 직접 추가한 접종이면 null)
    private Long scheduleNo;

    private String vaccineName;

    private String doseLabel;

    private Integer recommendedMonth;

    private Boolean completed;

    private LocalDate completedDate;

    private String hospitalName;

    private Boolean isCustom;

    private LocalDateTime regTime;

}