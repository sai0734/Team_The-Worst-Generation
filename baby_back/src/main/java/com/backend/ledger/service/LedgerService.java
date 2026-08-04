package com.backend.ledger.service;

import java.time.LocalDate;
import java.util.List;

import com.backend.ledger.dto.LedgerBriefingDTO;
import com.backend.ledger.dto.LedgerClassifyRequestDTO;
import com.backend.ledger.dto.LedgerClassifyResponseDTO;
import com.backend.ledger.dto.LedgerDTO;
import com.backend.ledger.dto.LedgerSettingDTO;
import com.backend.ledger.dto.LedgerSummaryDTO;

public interface LedgerService {

    Long register(LedgerDTO ledgerDTO);

    LedgerDTO get(Long lno, String email);

    void modify(LedgerDTO ledgerDTO, String email);

    void remove(Long lno, String email);

    List<LedgerDTO> listByRange(String email, LocalDate start, LocalDate end);

    LedgerSummaryDTO getSummary(String email);

    LedgerSettingDTO getSetting(String email);

    void updateBriefingDay(String email, Integer briefingDay);

    LedgerClassifyResponseDTO classify(LedgerClassifyRequestDTO requestDTO);

    LedgerBriefingDTO generateBriefing(String email);
}
