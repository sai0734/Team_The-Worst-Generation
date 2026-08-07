package com.backend.market.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarketProfileDTO {

    private String email;

    private BigDecimal mannerTemp;

    private String locationName;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private boolean locationVerified;

}
