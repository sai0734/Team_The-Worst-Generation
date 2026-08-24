package com.backend.assistant.controller;

import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.service.AssistBatchService;
import com.backend.assistant.service.AssistantService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assistant")
public class AssistantController {

    private final AssistantService assistantService;
    private final AssistBatchService assistBatchService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")        // YSJ -- 로그인한 유저만
    @PostMapping("/recommend")
    //YSJ --  프론트 post를 받는 곳, Service에 넘기고 다시 JSON으로 반환,
    public AssistRecommendresponse recommend(@RequestBody AssistRecommendRequest request) {
        return assistantService.recommend(request);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/ask")
    public AssistRecommendresponse ask(@RequestBody AssistRecommendRequest request) {
        return assistantService.ask(request);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/refresh")
    public AssistRecommendresponse refresh(Principal principal) {
        assistBatchService.refreshEmail(principal.getName());
        return assistantService.loadSnapshot(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/snapshot")
    public AssistRecommendresponse snapshot(Principal principal) {
        return assistantService.loadSnapshot(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/region")
    public AssistRegion region(Principal principal) {
        return assistantService.loadRegion(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/region")
    public void saveRegion(Principal principal, @RequestBody AssistRegion body) {
        assistantService.saveRegion(
                principal.getName(),
                body.getRegionSido(),
                body.getRegionSigungu(),
                body.getBabyMonths());
    }
}
