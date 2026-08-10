package com.backend.market.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDTO {

    private Long msgNo;

    private Long roomNo;

    private String senderEmail;

    @Builder.Default
    private String msgType = "TEXT";    // TEXT | OFFER | IMAGE

    private String content;             // TEXT: 메시지 내용, IMAGE: 업로드된 파일명

    private Integer offerPrice;

    private String offerStatus;         // PENDING | ACCEPTED | DECLINED

    private LocalDateTime regTime;

}
