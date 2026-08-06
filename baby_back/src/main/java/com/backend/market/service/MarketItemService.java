package com.backend.market.service;

import com.backend.dto.PageRequestDTO;
import com.backend.dto.PageResponseDTO;
import com.backend.market.dto.MarketItemDTO;

public interface MarketItemService {

    PageResponseDTO<MarketItemDTO> getList(PageRequestDTO pageRequestDTO);

    MarketItemDTO get(Long itemNo);

    Long register(MarketItemDTO marketItemDTO);

    void modify(MarketItemDTO marketItemDTO);

    void remove(Long itemNo);

    void increaseViewCount(Long itemNo);

    void bump(Long itemNo);
}
