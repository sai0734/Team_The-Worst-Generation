package com.backend.printorder.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PrintOrderItemRequestDTO {

    private Long albumNo;

    private Integer quantity;

}