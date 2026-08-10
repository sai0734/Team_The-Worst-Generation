package com.backend.babyInfo.controller;

import com.backend.babyInfo.dto.GrowthPercentileDTO;
import com.backend.babyInfo.service.GrowthPercentileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/growth-percentile")
@Log4j2
public class GrowthPercentileController {

    private final GrowthPercentileService growthPercentileService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyNo}")
    public GrowthPercentileDTO get(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("growthPercentile_Controller_get_실행~~~~~~~~~~~~");

        String email = principal.getName();

        GrowthPercentileDTO growthPercentileDTO = growthPercentileService.getPercentile(babyNo, email);

        return growthPercentileDTO;

    }

}