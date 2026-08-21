package com.backend.market.service;

import com.backend.market.dto.ChatRoomDTO;

import java.util.List;

public interface ChatRoomService {

    List<ChatRoomDTO> getListByMember(String memberEmail);

    // 이미 만들어진 방 있다면 그 방 반환, 없으면 새로 만들어서 반환(중복 방지)
    ChatRoomDTO getOrCreate(Long itemNo, String buyerEmail, String sellerEmail);

    // 1단계: 구매자가 거래 완료를 신청 (아직 거래완료 아님, 판매자 확인 대기)
    void requestComplete(Long roomNo, String requesterEmail);

    // 2단계: 판매자가 신청 내용을 확인하고 최종 확정 (구매자가 먼저 신청한 방만 가능)
    void confirmComplete(Long roomNo, String requesterEmail);
}
