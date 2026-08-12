package com.backend.market.service;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.market.dto.MarketItemDTO;

import java.util.List;

public interface MarketItemService {

    PageResponseDTO<MarketItemDTO> getList(PageRequestDTO pageRequestDTO);

    MarketItemDTO get(Long itemNo);

    // 내 위치(lat, lng) 기준 반경 radiusKm 안의 거래가능 매물, 가까운 순 정렬
    List<MarketItemDTO> getNearby(double lat, double lng, double radiusKm);

    Long register(MarketItemDTO marketItemDTO);

    void modify(MarketItemDTO marketItemDTO, String requesterEmail);

    void remove(Long itemNo, String requesterEmail);

    void increaseViewCount(Long itemNo);

    void bump(Long itemNo);
}
