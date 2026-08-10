package com.backend.diary.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyDiary {

    // PK
    private Long diaryNo;

    // FK
    private Long babyNo;

    private LocalDate diaryDate;

    private String photoFileName;

    private String content;

    private LocalDateTime regTime;

    private LocalDateTime modTime;

    public void changeContent(String content) {
        this.content = content;
    }

    public void changePhotoFileName(String photoFileName) {
        this.photoFileName = photoFileName;
    }

}
