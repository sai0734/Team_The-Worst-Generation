package com.backend.diary.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyDiaryDTO {

    // PK
    private Long diaryNo;

    // FK
    private Long babyNo;

    private LocalDate diaryDate;

    private String photoFileName;

    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>();

    private String content;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

}
