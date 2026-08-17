package com.backend.market.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {

    private Long reviewNo;

    private Long roomNo;

    private Long itemNo;

    private String writerEmail;

    private String targetEmail;

    private Integer rating;

    private String content;

    private BigDecimal tempDelta;

    private LocalDateTime regTime;

}
