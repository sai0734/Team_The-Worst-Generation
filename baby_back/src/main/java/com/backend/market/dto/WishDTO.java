package com.backend.market.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WishDTO {

    private Long wno;

    private Long itemNo;

    private String memberEmail;

    private LocalDateTime regTime;

}
