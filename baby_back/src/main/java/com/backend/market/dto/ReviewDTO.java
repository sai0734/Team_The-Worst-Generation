package com.backend.market.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReviewDTO {

    private Long reviewNo;

    private Long itemNo;

    private String writerEmail;

    private String targetEmail;

    private int rating;

    private String content;

    private LocalDateTime regTime;

}
