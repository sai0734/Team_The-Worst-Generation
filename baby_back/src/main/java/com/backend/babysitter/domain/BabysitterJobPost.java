package com.backend.babysitter.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterJobPost {

    private Long jobNo;

    private String parentEmail;

    private String title;

    private String region;

    private LocalDate desiredDate;

    private TimeSlotType timeSlot;

    private Integer hourlyRate;

    private String message;

    @Builder.Default
    private BabysitterJobStatus status = BabysitterJobStatus.OPEN;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeStatus(BabysitterJobStatus status) {
        this.status = status;
    }
}
