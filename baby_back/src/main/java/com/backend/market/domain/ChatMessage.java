package com.backend.market.domain;

import lombok.*;

import java.time.LocalDateTime;

// msgType이 OFFER인 경우만 offerPrice/offerStatus를 씀 (가격 제안 메시지)
// msgType이 IMAGE인 경우 content에 업로드된 이미지 파일명이 들어감 (파일 자체는 REST 멀티파트로 먼저 업로드하고, 그 결과 파일명만 메시지로 전송)
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessage {

    private Long msgNo;

    // FK (tbl_chat_room.roomNo)
    private Long roomNo;

    // FK (tbl_member.email)
    private String senderEmail;

    @Builder.Default
    private String msgType = "TEXT";    // TEXT | OFFER | IMAGE

    private String content;             // TEXT: 메시지 내용, IMAGE: 업로드된 파일명

    private Integer offerPrice;

    private String offerStatus;         // PENDING | ACCEPTED | DECLINED

    private LocalDateTime regTime;

    public void changeOfferStatus(String offerStatus) {
        this.offerStatus = offerStatus;
    }
}
