package com.backend.recall.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SafetyKorea 국내리콜정보 조회/상세조회 응답 (resultData) 매핑.
 * 목록 조회에서는 recallFiles(리콜사진)가 항상 null.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SafetyKoreaDomesticRecallDTO {

    private String recallUid;

    private String recallProductName;

    private String recallBrandName;

    private String recallModelName;

    private Integer recallModelCnt;

    private String recallTypeName;

    private String recallMeans;

    private String barcodeNum;

    private String categoryName;

    private String certNum;

    private String productItemName;

    private String recallCmpnyDivName;

    private String recallInqryTel;

    private String recallCmpnyName;

    private String recallCmpnySsn;

    private String recallFrgnCmpnyName;

    private String makerCntryName;

    private String makerName;

    private String makingCntryName;

    private String publishDate;

    private String publishRecallVol;

    private String recallActionAmt;

    private String recallStaDate;

    private String recallEndDate;

    private String harmDscr;

    private String accidentCaseDscr;

    private String publishActionDscr;

    // ---- 상세조회 전용 ----

    private List<SafetyKoreaRecallFileDTO> recallFiles;
}
