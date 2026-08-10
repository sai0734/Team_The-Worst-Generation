package com.backend.recall.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.recall.domain.CertConditionKey;
import com.backend.recall.domain.DomesticRecallConditionKey;
import com.backend.recall.domain.ForeignRecallConditionKey;
import com.backend.recall.dto.SafetyKoreaCertificationDTO;
import com.backend.recall.dto.SafetyKoreaDomesticRecallDTO;
import com.backend.recall.dto.SafetyKoreaForeignRecallDTO;
import com.backend.recall.service.RecallService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/recall")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class RecallController {

    private final RecallService recallService;

    @GetMapping("/certifications")
    public List<SafetyKoreaCertificationDTO> searchCertifications(
        @RequestParam CertConditionKey conditionKey,
        @RequestParam String conditionValue
    ) {
        return recallService.searchCertifications(conditionKey, conditionValue);
    }

    @GetMapping("/certifications/{certNum}")
    public SafetyKoreaCertificationDTO getCertificationDetail(@PathVariable String certNum) {

        return recallService.getCertificationDetail(certNum);
    }

    @GetMapping("/domestic")
    public List<SafetyKoreaDomesticRecallDTO> searchDomesticRecalls(
        @RequestParam DomesticRecallConditionKey conditionKey,
        @RequestParam String conditionValue
    ) {
        return recallService.searchDomesticRecalls(conditionKey, conditionValue);
    }

    @GetMapping("/domestic/{recallUid}")
    public SafetyKoreaDomesticRecallDTO getDomesticRecallDetail(@PathVariable String recallUid) {

        return recallService.getDomesticRecallDetail(recallUid);
    }

    @GetMapping("/foreign")
    public List<SafetyKoreaForeignRecallDTO> searchForeignRecalls(
        @RequestParam ForeignRecallConditionKey conditionKey,
        @RequestParam String conditionValue
    ) {
        return recallService.searchForeignRecalls(conditionKey, conditionValue);
    }
}
