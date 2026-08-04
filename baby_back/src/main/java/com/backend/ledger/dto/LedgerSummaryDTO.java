package com.backend.ledger.dto;

import com.backend.ledger.domain.LedgerCategory;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerSummaryDTO {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate cycleStart;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate cycleEnd;

    private int totalIncome;

    private int totalExpense;

    private Map<LedgerCategory, Integer> categoryBreakdown;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate prevCycleStart;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate prevCycleEnd;

    private int prevTotalIncome;

    private int prevTotalExpense;

    private Map<LedgerCategory, Integer> prevCategoryBreakdown;
}
