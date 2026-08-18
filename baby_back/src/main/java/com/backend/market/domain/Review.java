package com.backend.market.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 거래완료된 채팅방 1건당 온도 평가 1건. targetEmail 쪽 매너온도에 tempDelta를 그대로 더함.
// rating(별점)/content는 이제 선택적인 보여주기용 텍스트 후기일 뿐, 온도 계산엔 안 씀.
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Review {

    private Long reviewNo;

    // FK (tbl_chat_room.roomNo) - 거래 1건당 평가 1건만 남기게 하는 기준
    private Long roomNo;

    // FK (tbl_market_item.itemNo), nullable
    private Long itemNo;

    // FK (tbl_member.email)
    private String writerEmail;

    // FK (tbl_member.email)
    private String targetEmail;

    // 선택 - 텍스트 후기용, 매너온도 계산엔 사용 안 함
    private Integer rating;

    private String content;

    // 구매자가 직접 고른 매너온도 증감값 (-1.0 ~ +1.0, 0.1 단위)
    private BigDecimal tempDelta;

    private LocalDateTime regTime;
}
