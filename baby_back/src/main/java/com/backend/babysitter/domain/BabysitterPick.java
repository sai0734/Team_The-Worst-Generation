package com.backend.babysitter.domain;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterPick {

    private Long pickNo;

    private String sitterEmail;

    private String pickerEmail;

    private LocalDateTime regTime;
}
