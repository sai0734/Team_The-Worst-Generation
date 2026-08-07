package com.backend.babysitter.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterRequest {

    private Long requestNo;

    private String sitterEmail;

    private String parentEmail;

    private LocalDate requestDate;

    private TimeSlotType timeSlot;

    private String message;

    @Builder.Default
    private BabysitterRequestStatus status = BabysitterRequestStatus.PENDING;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeStatus(BabysitterRequestStatus status) {
        this.status = status;
    }
}
