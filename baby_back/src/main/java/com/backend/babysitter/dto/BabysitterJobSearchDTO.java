package com.backend.babysitter.dto;

import com.backend.babysitter.domain.TimeSlotType;
import com.backend.global.dto.PageRequestDTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterJobSearchDTO extends PageRequestDTO {

    private String region;

    private TimeSlotType timeSlot;

    private String keyword;
}
