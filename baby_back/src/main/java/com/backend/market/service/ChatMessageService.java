package com.backend.market.service;

import com.backend.market.dto.ChatMessageDTO;

import java.util.List;

public interface ChatMessageService {

    List<ChatMessageDTO> getListByRoom(Long roomNo, String requesterEmail);

    // 저장 후 msgNo/regTime 채워진 DTO 반환 (웹소켓 브로드캐스트용 페이로드로 그대로 사용)
    ChatMessageDTO sendMessage(ChatMessageDTO chatMessageDTO);

    void respondToOffer(Long msgNo, String offerStatus, String requesterEmail);
}
