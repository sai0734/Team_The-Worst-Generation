package com.backend.market.domain;

import lombok.*;

import java.math.BigDecimal;

// 마켓 전용 회원 부가정보 (매너온도/동네/동네인증). email 기준 1:1로 tbl_member를 참조.
// 기존 com.backend.domain.Member는 안 건드리고, 마켓 쪽에서만 필요한 정보를 별도 테이블(tbl_market_profile)로 관리.
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class MarketProfile {

    // PK / FK (tbl_member.email)
    private String email;

    @Builder.Default
    private BigDecimal mannerTemp = new BigDecimal("36.5");

    private String locationName; // 내 동네 (예: 역삼동)

    private BigDecimal latitude;

    private BigDecimal longitude;

    private boolean locationVerified;

    public void changeMannerTemp(BigDecimal mannerTemp) {
        this.mannerTemp = mannerTemp;
    }

    public void changeLocation(String locationName, BigDecimal latitude, BigDecimal longitude) {
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public void verifyLocation() {
        this.locationVerified = true;
    }
}
