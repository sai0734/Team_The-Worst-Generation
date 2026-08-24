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

    // 안전영역 저장 시점에 캡처한 프레임을 파이썬 AI서버로 보내 얻은 임베딩 벡터 (JSON 배열 텍스트)
    // - 아직 캡처된 적 없으면 null (이 경우 이탈 감지는 "준비 안 됨" 상태)
    private String baselineEmbedding;

    private String embeddingModelVersion;

    public void changeZone(BigDecimal xRatio, BigDecimal yRatio, BigDecimal wRatio, BigDecimal hRatio) {
        this.xRatio = xRatio;
        this.yRatio = yRatio;
        this.wRatio = wRatio;
        this.hRatio = hRatio;
    }

    public void changeBaseline(String baselineEmbedding, String embeddingModelVersion) {
        this.baselineEmbedding = baselineEmbedding;
        this.embeddingModelVersion = embeddingModelVersion;
    }
}
