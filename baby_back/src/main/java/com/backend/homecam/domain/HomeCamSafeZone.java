package com.backend.homecam.domain;

import lombok.*;

import java.math.BigDecimal;

// 홈캠 침대 (안전영역) 좌표
// 카메라 해상도가 바뀌어도 안전영역이 안틀어짐
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class HomeCamSafeZone {

    // PK / FK (tbl_member.email)
    private String email;

    private BigDecimal xRatio;

    private BigDecimal yRatio;

    private BigDecimal wRatio;

    private BigDecimal hRatio;

    public void changeZone(BigDecimal xRatio, BigDecimal yRatio, BigDecimal wRatio, BigDecimal hRatio) {
        this.xRatio = xRatio;
        this.yRatio = yRatio;
        this.wRatio = wRatio;
        this.hRatio = hRatio;
    }
}
