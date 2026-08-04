package com.backend.ledger.dto;

import com.backend.ledger.domain.LedgerCategory;
import com.backend.ledger.domain.LedgerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerClassifyResponseDTO {

    private LedgerType type;

    private LedgerCategory category;

    // 금액이 텍스트에서 같이 추출된 경우 (없으면 null)
    private Integer amount;
}
