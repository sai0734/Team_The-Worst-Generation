package com.backend.ledger.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;

@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Ledger {

    private Long lno;

    private String email;

    private LedgerType type;

    private LedgerCategory category;

    private int amount;

    private String memo;

    private LocalDate txDate;

    private LocalDateTime regTime;

    public void changeType(LedgerType type) {
        this.type = type;
    }

    public void changeCategory(LedgerCategory category) {
        this.category = category;
    }

    public void changeAmount(int amount) {
        this.amount = amount;
    }

    public void changeMemo(String memo) {
        this.memo = memo;
    }

    public void changeTxDate(LocalDate txDate) {
        this.txDate = txDate;
    }
}
