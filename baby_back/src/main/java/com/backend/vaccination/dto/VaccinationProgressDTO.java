package com.backend.vaccination.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VaccinationProgressDTO {

    private int totalCount;

    private int completedCount;

    // 남은 접종이 없으면 null
    @JsonProperty("dDay")
    private Integer dDay;

    // 남은 접종이 없으면 null
    private String nextVaccineName;

}