package com.backend.babysitter.domain;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterProfile {

    private String email;

    private String name;

    @Builder.Default
    private int careerYears = 0;

    private String region;

    private String availableTime;

    private Integer hourlyRate;

    private String intro;

    @Builder.Default
    private BabysitterStatus status = BabysitterStatus.ACTIVE;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeProfile(String name, int careerYears, String region, String availableTime,
                               Integer hourlyRate, String intro) {
        this.name = name;
        this.careerYears = careerYears;
        this.region = region;
        this.availableTime = availableTime;
        this.hourlyRate = hourlyRate;
        this.intro = intro;
    }

    public void changeStatus(BabysitterStatus status) {
        this.status = status;
    }
}
