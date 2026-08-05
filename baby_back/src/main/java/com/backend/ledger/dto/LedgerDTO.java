package com.backend.ledger.dto;

import com.backend.ledger.domain.LedgerCategory;
import com.backend.ledger.domain.LedgerType;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerDTO {

    private Long lno;

    private String email;

    private LedgerType type;

    private LedgerCategory category;

    private int amount;

    private String memo;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate txDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regTime;
}
