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

    private String content;

    private LocalDateTime regTime;

}
