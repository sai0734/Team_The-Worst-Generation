package com.backend.homecam.controller;

import com.backend.homecam.dto.HomeCamSafeZoneDTO;
import com.backend.homecam.service.HomeCamSafeZoneService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/homecam/safe-zone")
public class HomeCamSafeZoneController {

    private final HomeCamSafeZoneService homeCamSafeZoneService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/")
    public HomeCamSafeZoneDTO get(Principal principal) {
        return homeCamSafeZoneService.get(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/")
    public Map<String, String> save(@RequestBody HomeCamSafeZoneDTO dto, Principal principal) {
        dto.setEmail(principal.getName());
        homeCamSafeZoneService.save(dto);
        return Map.of("result", "success");
    }
}
