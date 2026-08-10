package com.backend.babysitter.domain;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterJobApplication {

    private Long applicationNo;

    private Long jobNo;

    private String sitterEmail;

    private String message;

    @Builder.Default
    private BabysitterJobApplicationStatus status = BabysitterJobApplicationStatus.PENDING;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeStatus(BabysitterJobApplicationStatus status) {
        this.status = status;
    }
}
