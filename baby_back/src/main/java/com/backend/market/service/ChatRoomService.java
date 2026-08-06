package com.backend.market.service;

import com.backend.market.dto.ChatRoomDTO;

import java.util.List;

public interface ChatRoomService {

    List<ChatRoomDTO> getListByMember(String memberEmail);

    // 이미 만들어진 방 있다면 그 방 반환, 없으면 새로 만들어서 반환(중복 방지)
    ChatRoomDTO getOrCreate(Long itemNo, String buyerEmail, String sellerEmail);
}
