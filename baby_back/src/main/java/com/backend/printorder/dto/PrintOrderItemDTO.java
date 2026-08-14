package com.backend.printorder.dto;

import lombok.*;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class PrintOrderItemDTO {

    private Long itemNo;

    private Long albumNo;

    private Integer quantity;

    private Integer unitPrice;

}