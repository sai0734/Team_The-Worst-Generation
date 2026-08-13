package com.backend.ledger.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LedgerBulkClassifyRequestDTO {

    // 한 줄에 하나씩, 사용자가 한 번에 입력한 가계부 기록 문장들
    private List<String> memos;
}
