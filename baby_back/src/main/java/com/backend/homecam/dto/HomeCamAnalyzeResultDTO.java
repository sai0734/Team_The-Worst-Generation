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

    // 안전영역 자체를 아직 설정한 적 없으면 false - outOfZone은 의미 없음
    private boolean ready;

    private boolean outOfZone;

}
