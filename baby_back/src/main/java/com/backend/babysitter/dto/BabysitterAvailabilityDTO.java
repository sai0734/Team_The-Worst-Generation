package com.backend.babysitter.dto;

import com.backend.babysitter.domain.DayOfWeekType;
import com.backend.babysitter.domain.TimeSlotType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterAvailabilityDTO {

    private DayOfWeekType dayOfWeek;

    private TimeSlotType timeSlot;
}
