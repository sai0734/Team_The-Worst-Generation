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
}
