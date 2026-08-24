package com.backend.homecam.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HomeCamSafeZoneDTO {

    private String email;

    @JsonProperty("xRatio")
    private BigDecimal xRatio;

    @JsonProperty("yRatio")
    private BigDecimal yRatio;

    @JsonProperty("wRatio")
    private BigDecimal wRatio;

    @JsonProperty("hRatio")
    private BigDecimal hRatio;

    // 안전영역 저장 시 프론트에서 같이 캡처해 보내는 기준 프레임(cropped) - 저장 응답에는 내려가지 않음
    @JsonProperty("baselineImageBase64")
    private String baselineImageBase64;

}