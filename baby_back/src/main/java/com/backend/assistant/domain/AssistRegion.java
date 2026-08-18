package com.backend.assistant.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistRegion {
    private String email;
    private String regionSido;
    private String regionSigungu;
    private Integer babyMonths;
}
