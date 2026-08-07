package com.backend.vaccination.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyVaccination {

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

    public void changeCompleted(Boolean completed) {
        this.completed = completed;
    }

    public void changeCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }

    public void changeHospitalName(String hospitalName) {
        this.hospitalName = hospitalName;
    }

}