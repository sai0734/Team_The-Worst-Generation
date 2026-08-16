package com.backend.album.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlbumPhotoMetaDTO {

    private LocalDate takenDate;

    private Double latitude;

    private Double longitude;

}
