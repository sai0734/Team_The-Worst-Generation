package com.backend.printorder.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PrintOrder {

    // PK
    private Long orderNo;

    // FK
    private String email;

    // FK
    private Long babyNo;

    private String orderId;

    private String paymentKey;

    private String status;

    private Integer totalAmount;

    private String receiverName;

    private String receiverPhone;

    private String zipcode;

    private String address;

    private String addressDetail;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

}