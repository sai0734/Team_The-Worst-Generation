package com.backend.babysitter.dto;

import java.time.LocalDateTime;

import com.backend.babysitter.domain.BabysitterStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterProfileDTO {

    private String email;

    private String name;

    private int careerYears;

    private String region;

    private String availableTime;

    private Integer hourlyRate;

    private String intro;

    private BabysitterStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
