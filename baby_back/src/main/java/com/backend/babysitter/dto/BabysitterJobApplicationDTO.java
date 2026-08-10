package com.backend.babysitter.dto;

import java.time.LocalDateTime;

import com.backend.babysitter.domain.BabysitterJobApplicationStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterJobApplicationDTO {

    private Long applicationNo;

    private Long jobNo;

    private String jobTitle;

    private String sitterEmail;

    private String sitterName;

    private String message;

    private BabysitterJobApplicationStatus status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
