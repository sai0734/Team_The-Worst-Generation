package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.domain.BabysitterParentLocation;
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
    public Map<String, Object> get(Principal principal) {

        BabysitterParentLocation location = babysitterParentLocationService.get(principal.getName());

        Map<String, Object> result = new HashMap<>();
        result.put("region", location != null && location.getRegion() != null ? location.getRegion() : "");
        result.put("latitude", location != null ? location.getLatitude() : null);
        result.put("longitude", location != null ? location.getLongitude() : null);
        return result;
    }

    @PutMapping("/")
    public Map<String, String> save(@RequestBody Map<String, Object> body, Principal principal) {

        String region = (String) body.get("region");
        Double latitude = body.get("latitude") != null ? ((Number) body.get("latitude")).doubleValue() : null;
        Double longitude = body.get("longitude") != null ? ((Number) body.get("longitude")).doubleValue() : null;

        babysitterParentLocationService.save(principal.getName(), region, latitude, longitude);

        return Map.of("RESULT", "SUCCESS");
    }
}
