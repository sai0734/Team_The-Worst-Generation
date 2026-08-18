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

    // 채팅방 목록에 매물번호 대신 표시할 매물 제목 (JOIN으로만 채워짐, DB 컬럼 아님)
    private String itemTitle;

    // 거래완료 버튼 / 온도평가 폼 노출 여부 판단용 (JOIN/서브쿼리로만 채워짐, DB 컬럼 아님)
    private String itemStatus;

    private boolean reviewed;
}
