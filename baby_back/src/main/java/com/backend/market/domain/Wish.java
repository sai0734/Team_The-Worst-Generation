package com.backend.market.domain;

import lombok.*;

import java.time.LocalDateTime;

// 찜 (itemNo + memberEmail UNIQUE 제약을 DB/매퍼에서 보장)
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Wish {

    private Long wno;

    // FK (tbl_market_item.itemNo)
    private Long itemNo;

    // FK (tbl_member.email)
    private String memberEmail;

    private LocalDateTime regTime;
}
