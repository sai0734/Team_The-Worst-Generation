package com.backend.babysitter.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterChatMessageDTO {

    private Long msgNo;

    private Long roomNo;

    private String senderEmail;

    @Builder.Default
    private String msgType = "TEXT";    // TEXT | REQUEST

    private String content;             // TEXT: 메시지 내용, REQUEST: 미사용(null)

    private Long requestNo;

    private String requestStatus;       // PENDING | ACCEPTED | REJECTED

    private LocalDateTime regTime;

}
