package com.backend.babysitter.service;

import java.time.LocalDate;
import java.util.List;

import com.backend.babysitter.dto.BabysitterRequestDTO;

public interface BabysitterRequestService {

    Long register(BabysitterRequestDTO requestDTO);

    List<BabysitterRequestDTO> listReceived(String sitterEmail);

    List<BabysitterRequestDTO> listSent(String parentEmail);

    void accept(Long requestNo, String sitterEmail);

    void reject(Long requestNo, String sitterEmail);

    void cancel(Long requestNo, String parentEmail);

    // 대기중(PENDING)인 내 요청의 날짜/시간대/메시지만 수정 - 채팅 안 "요청 보내기"를 다시 눌렀을 때 사용
    void modify(Long requestNo, BabysitterRequestDTO requestDTO, String parentEmail);

    // 이미 수락되어 예약이 잡힌 날짜 목록 - 새 요청 폼에서 중복 예약을 막는 용도 (누구나 조회 가능, 날짜만 노출)
    List<LocalDate> getBookedDates(String sitterEmail);
}
