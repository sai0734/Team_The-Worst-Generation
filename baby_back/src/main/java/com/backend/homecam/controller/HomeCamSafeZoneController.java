package com.backend.homecam.controller;

import com.backend.homecam.dto.HomeCamAnalyzeRequestDTO;
import com.backend.homecam.dto.HomeCamAnalyzeResultDTO;
import com.backend.homecam.dto.HomeCamSafeZoneDTO;
import com.backend.homecam.service.HomeCamAnalyzeService;
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
@RequestMapping("/api/homecam")
public class HomeCamSafeZoneController {

    private final HomeCamSafeZoneService homeCamSafeZoneService;

    private final HomeCamAnalyzeService homeCamAnalyzeService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/safe-zone/")
    public HomeCamSafeZoneDTO get(Principal principal) {
        return homeCamSafeZoneService.get(principal.getName());
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/safe-zone/")
    public Map<String, String> save(@RequestBody HomeCamSafeZoneDTO dto, Principal principal) {
        dto.setEmail(principal.getName());
        homeCamSafeZoneService.save(dto);
        return Map.of("result", "success");
    }

    // 프론트가 주기적으로 안전영역 크롭 프레임을 보내면, 저장된 기준(baseline) 임베딩과
    // 비교한 결과(유사도/이탈여부)만 돌려줌 - 파이썬 AI서버는 여기서 직접 호출하지 않고
    // 반드시 이 백엔드를 거쳐서만 사용됨
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/analyze")
    public HomeCamAnalyzeResultDTO analyze(@RequestBody HomeCamAnalyzeRequestDTO dto, Principal principal) {
        return homeCamAnalyzeService.analyze(principal.getName(), dto.getImageBase64());
    }
}
