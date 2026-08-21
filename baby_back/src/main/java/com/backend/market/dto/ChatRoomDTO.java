package com.backend.market.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoomDTO {

    private Long roomNo;

    private Long itemNo;

    private String buyerEmail;

    private String sellerEmail;

    private LocalDateTime regTime;

    private LocalDateTime completeRequestedAt;

    private String itemTitle;

    private String itemStatus;

    private boolean reviewed;

}
