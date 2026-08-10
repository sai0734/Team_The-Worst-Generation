package com.backend.babysitter.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.*;

@Getter
@ToString(exclude = "availabilityList")
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

    private String profileImageFileName;

    @Builder.Default
    private BabysitterStatus status = BabysitterStatus.ACTIVE;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    @Builder.Default
    private List<BabysitterAvailability> availabilityList = new ArrayList<>();

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

    public void changeProfileImage(String profileImageFileName) {
        this.profileImageFileName = profileImageFileName;
    }
}
