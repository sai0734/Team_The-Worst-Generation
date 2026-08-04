package com.backend.babyInfo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabyInfoDTO {

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

}
