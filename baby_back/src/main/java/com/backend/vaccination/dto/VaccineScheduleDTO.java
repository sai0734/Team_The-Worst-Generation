package com.backend.vaccination.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VaccineScheduleDTO {

    // PK
    private Long scheduleNo;

    private String vaccineName;

    private String doseLabel;

    private Integer recommendedMonth;

    private Integer displayOrder;

}