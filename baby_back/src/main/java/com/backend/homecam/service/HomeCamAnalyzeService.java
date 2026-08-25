package com.backend.homecam.service;

import com.backend.homecam.dto.HomeCamAnalyzeResultDTO;

public interface HomeCamAnalyzeService {

    // 카메라 전체 프레임에서 사람을 탐지하고, 저장된 안전영역과 겹치는지 판정
    // 안전영역 자체가 아직 없으면 ready=false로 반환 (임의 판정하지 않음)
    HomeCamAnalyzeResultDTO analyze(String email, String imageBase64);

}
