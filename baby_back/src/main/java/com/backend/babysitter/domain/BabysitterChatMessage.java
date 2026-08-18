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

    @Builder.Default
    private String msgType = "TEXT";    // TEXT | REQUEST

    private String content;             // TEXT: 메시지 내용, REQUEST: 미사용(null)

    // FK (tbl_babysitter_request.requestNo) - msgType이 REQUEST인 경우만
    private Long requestNo;

    private String requestStatus;       // PENDING | ACCEPTED | REJECTED - REQUEST 카드 렌더링용 스냅샷

    private LocalDateTime regTime;
}
