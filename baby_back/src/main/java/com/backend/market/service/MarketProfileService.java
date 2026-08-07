package com.backend.market.service;

import com.backend.market.dto.MarketProfileDTO;

public interface MarketProfileService {

    // 프로필이 없으면 36.5도 기본값으로 새로 반환
    MarketProfileDTO get(String email);

    void modify(MarketProfileDTO marketProfileDTO);

    void verifyLocation(String email);
}
