package com.backend.album.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
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
public class BabyAlbumDTO {

    // PK
    private Long albumNo;

    // FK
    private Long babyNo;

    private String photoFileName;

    @Builder.Default
    private List<MultipartFile> files = new ArrayList<>();

    private LocalDate takenDate;

    private Double latitude;

    private Double longitude;

    private LocalDateTime regTime;

}