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

}
