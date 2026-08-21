package com.backend.recall.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.recall.dto.RecallSettingDTO;
import com.backend.recall.service.RecallSettingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/recall/setting")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class RecallSettingController {

    private final RecallSettingService recallSettingService;

    @GetMapping
    public RecallSettingDTO getSetting(Principal principal) {
        return recallSettingService.getSetting(principal.getName());
    }

    @PutMapping
    public RecallSettingDTO updatePhone(@RequestBody Map<String, String> body, Principal principal) {
        recallSettingService.updatePhone(principal.getName(), body.get("notificationPhone"));
        return recallSettingService.getSetting(principal.getName());
    }
}
