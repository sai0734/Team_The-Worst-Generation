package com.backend.market.dto;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RentalDetailDTO {

    private Long itemNo;

    private int deposit;

    private Integer minDays;

    private Integer maxDays;

}
