package com.backend.homecam.service;

import com.backend.homecam.dto.HomeCamSafeZoneDTO;

public interface HomeCamSafeZoneService {

    // 저장된 안전영역이 없으면 null 반환
    HomeCamSafeZoneDTO get(String email);

    // 있으면 덮어쓰고 없으면 새로 생성 - 사용자당 항상 1개만 유지
    void save(HomeCamSafeZoneDTO dto);

}
