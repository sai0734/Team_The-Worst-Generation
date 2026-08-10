package com.backend.babysitter.domain;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterReview {

    private Long reviewNo;

    private Long requestNo;

    private String sitterEmail;

    private String writerEmail;

    private int rating;

    private String content;

    private LocalDateTime regTime;
}
