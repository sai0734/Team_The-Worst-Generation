package com.backend.quest.controller;

import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.UrgentQuestCreateDTO;
import com.backend.quest.service.QuestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/quest")
public class QuestController {

    private final QuestService questService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/home")
    public QuestHomeDTO home(Principal principal) {
        return questService.getHome(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{id}/complete")
    public MemberQuestDTO complete(
            Principal principal,
            @PathVariable("id") Long id) {
        return questService.complete(principal.getName(), id);
    }

    // YSJ - 배우자가 상대에게 긴급퀘 생성
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/urgent")
    public MemberQuestDTO createUrgent(
            Principal principal,
            @RequestBody UrgentQuestCreateDTO dto) {
        return questService.createUrgentBySpouse(principal.getName(), dto);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{id}/uncomplete")
    public MemberQuestDTO uncomplete(
            Principal principal,
            @PathVariable("id") Long id) {
        return questService.uncomplete(principal.getName(), id);
    }
}
