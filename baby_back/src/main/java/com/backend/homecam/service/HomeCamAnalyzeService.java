package com.backend.homecam.service;

import com.backend.homecam.dto.HomeCamAnalyzeResultDTO;

public interface HomeCamAnalyzeService {

    // 안전영역 저장 시점에 캡처된 프레임으로 기준 임베딩을 새로 만들어 저장
    void captureBaseline(String email, String baselineImageBase64);

    // 현재 프레임을 기준 임베딩과 비교해서 안전영역 이탈 여부 판정
    // 기준 임베딩이 아직 없으면 ready=false로 반환 (임의 판정하지 않음)
    HomeCamAnalyzeResultDTO analyze(String email, String imageBase64);

}
