package com.backend.babysitter.service;

import com.backend.babysitter.dto.BabysitterChatRoomDTO;

import java.util.List;

public interface BabysitterChatRoomService {

    List<BabysitterChatRoomDTO> getListByMember(String memberEmail);

    // 이미 만들어진 방 있다면 그 방 반환, 없으면 새로 만들어서 반환(중복 방지)
    BabysitterChatRoomDTO getOrCreate(String parentEmail, String sitterEmail);
}
