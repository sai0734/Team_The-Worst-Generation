package com.backend.babysitter.domain;

import lombok.*;

import java.time.LocalDateTime;

// 부모-시터 1:1 채팅방
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterChatRoom {

    private Long roomNo;

    // FK (tbl_member.email)
    private String parentEmail;

    // FK (tbl_babysitter_profile.email)
    private String sitterEmail;

    private LocalDateTime regTime;

    // 안읽음 배지 계산용: 각자 마지막으로 읽은 메시지 번호
    private Long parentLastReadMsgNo;
    private Long sitterLastReadMsgNo;

    // selectListByMember에서만 채워짐(조회 시점 계산값, DB 컬럼 아님)
    private Integer unreadCount;
}
