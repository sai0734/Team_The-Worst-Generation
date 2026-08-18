package com.backend.babysitter.service;

import com.backend.babysitter.dto.BabysitterChatMessageDTO;

import java.util.List;

public interface BabysitterChatMessageService {

    List<BabysitterChatMessageDTO> getListByRoom(Long roomNo, String requesterEmail);

    // 저장 후 msgNo/regTime 채워진 DTO 반환 (웹소켓 브로드캐스트용 페이로드로 그대로 사용)
    BabysitterChatMessageDTO sendMessage(BabysitterChatMessageDTO chatMessageDTO);
}
