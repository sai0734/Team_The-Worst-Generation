package com.backend.quest.controller;

import com.backend.auth.dto.MemberDTO;
import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.UrgentQuestCreateDTO;
import com.backend.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quest")
public class QuestController {

    private final QuestService questService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/home")
    public QuestHomeDTO home(@AuthenticationPrincipal MemberDTO member) {
        return questService.getHome(member.getEmail(), member.getProfileId());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{id}/complete")
    public MemberQuestDTO complete(
            @AuthenticationPrincipal MemberDTO member,
            @PathVariable("id") Long id) {
        return questService.complete(member.getEmail(), id);
    }

    // YSJ - 같은 아이디의 상대 프로필에게 긴급퀘 생성 후 실시간 푸시
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/urgent")
    public MemberQuestDTO createUrgent(
            @AuthenticationPrincipal MemberDTO member,
            @RequestBody UrgentQuestCreateDTO dto) {
        return questService.createUrgentForOtherProfile(
                member.getEmail(), member.getProfileId(), dto);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{id}/uncomplete")
    public MemberQuestDTO uncomplete(
            @AuthenticationPrincipal MemberDTO member,
            @PathVariable("id") Long id) {
        return questService.uncomplete(member.getEmail(), id);
    }
}
