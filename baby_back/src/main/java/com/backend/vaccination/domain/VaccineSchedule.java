package com.backend.vaccination.domain;

import lombok.*;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class VaccineSchedule {

    // PK
    private Long scheduleNo;

    private String vaccineName;

    private String doseLabel;

    private Integer recommendedMonth;

    private Integer displayOrder;

}