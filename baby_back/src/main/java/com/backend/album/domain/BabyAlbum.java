package com.backend.album.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class BabyAlbum {

    // PK
    private Long albumNo;

    // FK
    private Long babyNo;

    private String photoFileName;

    private LocalDate takenDate;

    private Double latitude;

    private Double longitude;

    private LocalDateTime regTime;

}