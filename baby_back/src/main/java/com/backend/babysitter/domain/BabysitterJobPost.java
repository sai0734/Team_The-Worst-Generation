package com.backend.babysitter.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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

    private BigDecimal latitude;

    private BigDecimal longitude;

    // selectByJobNo/selectList 등에서 별도 조회로 채워짐(tbl_babysitter_job_desired_day)
    private List<DayOfWeekType> desiredDays;

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
