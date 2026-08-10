package com.backend.recall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SafetyKorea 국외리콜정보 조회 응답 (resultData) 매핑.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKoreaForeignRecallDTO {

    private String fRecallUid;

    private String recallModelName;

    private String recallModelCnt;

    private String recallProductName;

    private String recallBrandName;

    private String makerName;

    private String makingCntryName;

    private String recallTypeName;

    private String recallPblshCntryName;

    private String recallPblshOrgnName;

    private String recallMeans;

    private String violateDscr;

    private String accidentCaseDscr;

    private String publishActionDscr;

    private String recallProductDscr;

    private String recallUrl;

    private String publishDate;

    private String signDttm;

    // 콤마(,)로 구분된 여러 이미지 URL 원문 (필요 시 split해서 사용)
    private String imageUrl;
}
