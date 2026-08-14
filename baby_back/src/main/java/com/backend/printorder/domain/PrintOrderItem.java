package com.backend.printorder.domain;

import lombok.*;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PrintOrderItem {

    // PK
    private Long itemNo;

    // FK
    private Long orderNo;

    // FK
    private Long albumNo;

    private Integer quantity;

    private Integer unitPrice;

}