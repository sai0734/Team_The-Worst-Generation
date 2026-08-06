package com.backend.quest.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class MonthlyPopupDTO {
    private String MonthKey;
    private boolean draw;   //공동우승 여부
    private boolean winner; //누가 승자인지
    private List<String> couponTitles;
}
