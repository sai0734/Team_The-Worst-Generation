package com.backend.recall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKoreaFactoryDTO {

    private String makerName;

    private String makerCntryName;
}
