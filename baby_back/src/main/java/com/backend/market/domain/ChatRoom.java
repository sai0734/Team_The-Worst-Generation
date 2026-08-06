package com.backend.market.domain;

import lombok.*;

import java.time.LocalDateTime;

// 매물 하나당 구매자/대여자 - 판매자/소유자 사이 채팅방
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class ChatRoom {

    private Long roomNo;

    // FK (tbl_market_item.itemNo)
    private Long itemNo;

    // FK (tbl_member.email)
    private String buyerEmail;

    // FK (tbl_member.email)
    private String sellerEmail;

    private LocalDateTime regTime;
}
