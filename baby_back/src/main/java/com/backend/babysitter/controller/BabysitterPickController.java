package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.service.BabysitterPickService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/picks")
public class BabysitterPickController {

    private final BabysitterPickService babysitterPickService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{email}")
    public Map<String, Boolean> toggle(@PathVariable String email, Principal principal) {

        boolean picked = babysitterPickService.toggle(email, principal.getName());

        return Map.of("picked", picked);
    }

    @GetMapping("/{email}/count")
    public Map<String, Long> count(@PathVariable String email) {

        return Map.of("count", babysitterPickService.countBySitter(email));
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{email}/mine")
    public Map<String, Boolean> mine(@PathVariable String email, Principal principal) {

        return Map.of("picked", babysitterPickService.isPicked(email, principal.getName()));
    }
}
