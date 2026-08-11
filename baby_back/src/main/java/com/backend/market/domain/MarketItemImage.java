package com.backend.market.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MarketItemImage {

    private String fileName;

    private int ord;

    public void changeOrd(int ord) {
        this.ord = ord;
    }
}
