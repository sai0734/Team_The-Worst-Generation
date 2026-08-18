package com.backend.printorder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrintOrderConfirmRequestDTO {

    private String orderId;

    private String paymentKey;

    private Integer amount;

}