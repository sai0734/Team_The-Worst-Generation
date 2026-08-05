package com.backend.ledger.controller;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.ledger.dto.LedgerBriefingDTO;
import com.backend.ledger.dto.LedgerClassifyRequestDTO;
import com.backend.ledger.dto.LedgerClassifyResponseDTO;
import com.backend.ledger.dto.LedgerDTO;
import com.backend.ledger.dto.LedgerSettingDTO;
import com.backend.ledger.dto.LedgerSummaryDTO;
import com.backend.ledger.service.LedgerService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/ledger")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class LedgerController {

    private final LedgerService ledgerService;

    @PostMapping("/")
    public Map<String, Long> register(@RequestBody LedgerDTO ledgerDTO, Principal principal) {

        ledgerDTO.setEmail(principal.getName());

        Long lno = ledgerService.register(ledgerDTO);

        return Map.of("LNO", lno);
    }

    @GetMapping("/{lno}")
    public LedgerDTO get(@PathVariable Long lno, Principal principal) {

        return ledgerService.get(lno, principal.getName());
    }

    @GetMapping("/")
    public List<LedgerDTO> list(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
        Principal principal
    ) {

        return ledgerService.listByRange(principal.getName(), start, end);
    }

    @PutMapping("/{lno}")
    public Map<String, String> modify(
        @PathVariable Long lno,
        @RequestBody LedgerDTO ledgerDTO,
        Principal principal
    ) {

        ledgerDTO.setLno(lno);

        ledgerService.modify(ledgerDTO, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @DeleteMapping("/{lno}")
    public Map<String, String> remove(@PathVariable Long lno, Principal principal) {

        ledgerService.remove(lno, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @GetMapping("/summary")
    public LedgerSummaryDTO summary(Principal principal) {

        return ledgerService.getSummary(principal.getName());
    }

    @GetMapping("/setting")
    public LedgerSettingDTO getSetting(Principal principal) {

        return ledgerService.getSetting(principal.getName());
    }

    @PutMapping("/setting")
    public Map<String, String> updateSetting(
        @RequestBody Map<String, Integer> body,
        Principal principal
    ) {

        ledgerService.updateBriefingDay(principal.getName(), body.get("briefingDay"));

        return Map.of("RESULT", "SUCCESS");
    }

    @PostMapping("/classify")
    public LedgerClassifyResponseDTO classify(@RequestBody LedgerClassifyRequestDTO requestDTO) {

        return ledgerService.classify(requestDTO);
    }

    @PostMapping("/briefing")
    public LedgerBriefingDTO briefing(Principal principal) {

        return ledgerService.generateBriefing(principal.getName());
    }
}
