package com.backend.babysitter.domain;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BabysitterAvailability {

    private String email;

    private DayOfWeekType dayOfWeek;

    private TimeSlotType timeSlot;
}
