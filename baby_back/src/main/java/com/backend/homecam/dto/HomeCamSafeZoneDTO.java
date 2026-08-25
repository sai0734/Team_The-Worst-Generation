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

}