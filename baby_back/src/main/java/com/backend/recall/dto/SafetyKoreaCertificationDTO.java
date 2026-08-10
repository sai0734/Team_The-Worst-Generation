package com.backend.recall.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SafetyKorea KC인증정보 조회/상세조회 응답 (resultData) 매핑.
 * 목록 조회에서는 아래쪽 상세 전용 필드(derivationModels 등)는 항상 null.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKoreaCertificationDTO {

    private Long certUid;

    private String certOrganName;

    private String certNum;

    private String certState;

    private String certDiv;

    private String certDate;

    private String certChgDate;

    private String certChgReason;

    private String firstCertNum;

    private String productName;

    private String brandName;

    private String modelName;

    private String categoryName;

    private String importDiv;

    private String makerName;

    private String makerCntryName;

    private String importerName;

    private String remark;

    private String signDate;

    // ---- 상세조회 전용 ----

    private List<String> derivationModels;

    private List<String> certificationImageUrls;

    private List<SafetyKoreaFactoryDTO> factories;

    private List<SafetyKoreaCertificationDTO> similarCertifications;
}
