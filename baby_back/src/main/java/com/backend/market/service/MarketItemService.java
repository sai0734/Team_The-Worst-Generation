package com.backend.market.service;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.market.dto.MarketItemDTO;

import java.util.List;

public interface MarketItemService {

    PageResponseDTO<MarketItemDTO> getList(PageRequestDTO pageRequestDTO);

    MarketItemDTO get(Long itemNo);

    // 내 위치(lat, lng) 기준 반경 radiusKm 안의 거래가능 매물, 가까운 순 정렬
    // category/keyword는 선택값 (null 이거나 category가 "전체" 면 필터 안 함)
    List<MarketItemDTO> getNearby(double lat, double lng, double radiusKm, String category, String keyword);

    Long register(MarketItemDTO marketItemDTO);

    void modify(MarketItemDTO marketItemDTO, String requesterEmail);

    void remove(Long itemNo, String requesterEmail);

    void increaseViewCount(Long itemNo);

    void bump(Long itemNo);

    // 로그인한 판매자 본인이 등록한 매물 전체 (삭제된 매물 제외)
    List<MarketItemDTO> getMine(String sellerEmail);

    // 거래완료 최종 확정 - 구매자가 신청하고 판매자가 확정하는 흐름. 권한 확인은 ChatRoomService에서 이미 끝내고 호출함
    void markAsCompleted(Long itemNo);
}