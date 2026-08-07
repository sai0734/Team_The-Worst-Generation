package com.backend.babysitter.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.backend.babysitter.domain.BabysitterRequestStatus;
import com.backend.babysitter.domain.TimeSlotType;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterRequestDTO {

    private Long requestNo;

    private String sitterEmail;

    private String sitterName;

    private String parentEmail;

    private String parentNickname;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate requestDate;

    private TimeSlotType timeSlot;

    private String message;

    private BabysitterRequestStatus status;

    private boolean reviewed;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime modTime;
}
