package com.backend.printorder.dto;

import lombok.*;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class TossPaymentResponseDTO {

    private String paymentKey;

    private String orderId;

    private String status;

    private Integer totalAmount;

    private String method;

    private String approvedAt;

}