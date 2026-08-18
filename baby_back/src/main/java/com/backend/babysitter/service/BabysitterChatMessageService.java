package com.backend.babysitter.service;

import com.backend.babysitter.dto.BabysitterChatMessageDTO;

import java.util.List;

public interface BabysitterChatMessageService {

    List<BabysitterChatMessageDTO> getListByRoom(Long roomNo, String requesterEmail);

    // 저장 후 msgNo/regTime 채워진 DTO 반환 (웹소켓 브로드캐스트용 페이로드로 그대로 사용)
    BabysitterChatMessageDTO sendMessage(BabysitterChatMessageDTO chatMessageDTO);

    // action: "accept" | "reject" - 채팅 안 요청 카드에 대한 응답. 실제 요청 상태는
    // BabysitterRequestService의 기존 accept/reject로 처리하고, 카드용 스냅샷만 같이 갱신한다.
    void respondToRequestCard(Long msgNo, String action, String requesterEmail);
}
