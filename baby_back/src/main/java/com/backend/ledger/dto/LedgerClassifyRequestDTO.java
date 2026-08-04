package com.backend.ledger.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerClassifyRequestDTO {

    // 사용자가 입력한 자유 텍스트 (예: "치킨 23000원")
    private String memo;
}
