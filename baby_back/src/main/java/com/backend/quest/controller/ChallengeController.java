package com.backend.quest.controller;

import com.backend.quest.dto.ChallengeDTO;
import com.backend.quest.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/challenge")
public class ChallengeController {

    private final ChallengeService challengeService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/my")
    public List<ChallengeDTO> myChallenges(Principal principal) {
        return challengeService.myChallenges(principal.getName());
    }

    // 챌린지 시작
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{challengeId}/start")
    public Map<String, String> start(
            Principal principal,
            @PathVariable("challengeId") Long challengeId) {
        challengeService.start(principal.getName(), challengeId);
        return Map.of("RESULT", "SUCCESS");
    }

    // 일일 체크인 (member_challenge.id)
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{memberChallengeId}/checkin")
    public Map<String, String> checkin(
            Principal principal,
            @PathVariable("memberChallengeId") Long memberChallengeId) {
        challengeService.checkin(principal.getName(), memberChallengeId);
        return Map.of("RESULT", "SUCCESS");
    }
}