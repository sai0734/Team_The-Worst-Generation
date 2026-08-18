package com.backend.babysitter.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterChatMessage {

    private Long msgNo;

    // FK (tbl_babysitter_chat_room.roomNo)
    private Long roomNo;

    // FK (tbl_member.email)
    private String senderEmail;

    private String content;

    private LocalDateTime regTime;
}
