package com.backend.market.domain;

import lombok.*;

// 대여형 매물의 보증금/대여기간 (MarketItem과 1:1, itemNo가 PK이자 FK)
@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class RentalDetail {

    // PK / FK (tbl_market_item.itemNo)
    private Long itemNo;

    private int deposit;        // 보증금

    private Integer minDays;

    private Integer maxDays;

    public void changeDeposit(int deposit) {
        this.deposit = deposit;
    }

    public void changeDays(Integer minDays, Integer maxDays) {
        this.minDays = minDays;
        this.maxDays = maxDays;
    }
}
