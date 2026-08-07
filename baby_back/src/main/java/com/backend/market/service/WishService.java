package com.backend.market.service;

import com.backend.market.dto.WishDTO;

import java.util.List;

public interface WishService {

    List<WishDTO> getListByMember(String memberEmail);

    // 찜 안되어 있으면 등록 후 true, 이미 되어있다면 취소하고 false 반환
    boolean toggle(Long itemNo, String memberEmail);

    long countByItem(Long itemNo);
}
