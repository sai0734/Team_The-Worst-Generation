package com.backend.walk.controller;

import com.backend.walk.dto.WalkTrailDTO;
import com.backend.walk.service.WalkTrailServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/walk/trail")
public class WalkTrailController {

    private final WalkTrailServiceImpl walkTrailServiceImpl;

    // 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안에서 가까운 순으로 limit(기본 5)개 추천
    @GetMapping("/nearby")
    public List<WalkTrailDTO> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radiusKm,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return walkTrailServiceImpl.getNearby(lat, lng, radiusKm, limit);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping
    public Map<String, Long> register(@RequestBody WalkTrailDTO walkTrailDTO) {

        Long trailNo = walkTrailServiceImpl.register(walkTrailDTO);

        return Map.of("result", trailNo);
    }
}