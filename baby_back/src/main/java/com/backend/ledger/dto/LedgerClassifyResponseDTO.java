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

    // 금액/통화 단위를 뺀 순수 항목명 (예: "기저귀 32000원" -> "기저귀")
    private String description;

    // 영수증에서 추출한 결제일자 (yyyy-MM-dd), 없으면 null
    private String txDate;
}
