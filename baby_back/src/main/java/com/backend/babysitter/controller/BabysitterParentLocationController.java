package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.service.BabysitterParentLocationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/location")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterParentLocationController {

    private final BabysitterParentLocationService babysitterParentLocationService;

    @GetMapping("/")
    public Map<String, String> get(Principal principal) {

        String region = babysitterParentLocationService.getRegion(principal.getName());

        return Map.of("region", region != null ? region : "");
    }

    @PutMapping("/")
    public Map<String, String> save(@RequestBody Map<String, String> body, Principal principal) {

        babysitterParentLocationService.saveRegion(principal.getName(), body.get("region"));

        return Map.of("RESULT", "SUCCESS");
    }
}
