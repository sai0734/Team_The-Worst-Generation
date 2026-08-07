package com.backend.market.controller;

import com.backend.market.dto.MarketProfileDTO;
import com.backend.market.service.MarketProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/market/profile")
public class MarketProfileController {

    private final MarketProfileService marketProfileService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/")
    public MarketProfileDTO getMine(Principal principal) {
        return marketProfileService.get(principal.getName());
    }

    @GetMapping("/{email}")
    public MarketProfileDTO getOther(@PathVariable String email) {
        return marketProfileService.get(email);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/")
    public Map<String, String> modify(@RequestBody MarketProfileDTO marketProfileDTO, Principal principal) {

        marketProfileDTO.setEmail(principal.getName());

        marketProfileService.modify(marketProfileDTO);

        return Map.of("result", "success");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/verify-location")
    public Map<String, String> verifyLocation(Principal principal) {

        marketProfileService.verifyLocation(principal.getName());

        return Map.of("result", "success");
    }
}