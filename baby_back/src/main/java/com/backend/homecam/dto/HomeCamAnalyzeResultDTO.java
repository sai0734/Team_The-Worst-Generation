package com.backend.homecam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HomeCamAnalyzeResultDTO {

    // 기준(baseline) 이미지가 아직 캡처된 적 없으면 false - similarity/isOutOfZone은 의미 없음
    private boolean ready;

    private Double similarity;

    private boolean outOfZone;

}
