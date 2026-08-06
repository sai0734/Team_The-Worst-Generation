package com.backend.babyInfo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>();

    private String bloodType;

    private Integer birthWeekCount;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

}
