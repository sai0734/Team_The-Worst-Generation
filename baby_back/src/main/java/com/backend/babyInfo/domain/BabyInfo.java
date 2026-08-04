package com.backend.babyInfo.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabyInfo {

    // PK
    private Long babyNo;

    // FK
    private String email;

    private String babyName;

    private LocalDate birthDate;

    private String gender;

    private String profileImageFileName;

    private String bloodType;

    private Integer birthWeekCount;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeName(String name) {
        this.babyName = name;
    }

    public void changeBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public void changeGender(String gender) {
        this.gender = gender;
    }

    public void changeBloodType(String bloodType) {
        this.bloodType = bloodType;
    }

    public void changeBirthWeekCount(Integer birthWeekCount) {
        this.birthWeekCount = birthWeekCount;
    }

    public void changeProfileImageFileName(String profileImageFileName) {
        this.profileImageFileName = profileImageFileName;
    }

}
