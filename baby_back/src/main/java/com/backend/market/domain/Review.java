package com.backend.market.domain;

import lombok.*;

import java.time.LocalDateTime;

// 거래 후기. targetEmail 쪽 매너온도 계산에 사용
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Review {

    private Long reviewNo;

    // FK (tbl_market_item.itemNo), nullable
    private Long itemNo;

    // FK (tbl_member.email)
    private String writerEmail;

    // FK (tbl_member.email)
    private String targetEmail;

    private int rating;

    private String content;

    private LocalDateTime regTime;
}
