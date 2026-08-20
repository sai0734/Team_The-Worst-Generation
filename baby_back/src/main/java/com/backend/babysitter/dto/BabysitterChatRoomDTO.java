package com.backend.babysitter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterChatRoomDTO {

    private Long roomNo;

    private String parentEmail;

    private String sitterEmail;

    private LocalDateTime regTime;

    // 이 방에서 내가 아직 안 읽은 상대방 메시지 수 (getMyList 조회 시점 기준)
    private Integer unreadCount;

}
