package com.backend.babyInfo.controller;

import com.backend.babyInfo.dto.BabyGrowInfoDTO;
import com.backend.babyInfo.service.BabyGrowInfoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/baby-grow-info")
@Log4j2
public class BabyGrowInfoController {

    private final BabyGrowInfoService babyGrowInfoService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list/{babyNo}")
    public List<BabyGrowInfoDTO> list(@PathVariable("babyNo") Long babyNo, Principal principal) {

        log.info("babyGrowInfo_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<BabyGrowInfoDTO> babyGrowInfoDTOList = babyGrowInfoService.getList(babyNo, email);

        return babyGrowInfoDTOList;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyGrowNo}")
    public BabyGrowInfoDTO get(@PathVariable("babyGrowNo") Long babyGrowNo, Principal principal) {

        log.info("babyGrowInfo_Controller_get_실행~~~~~~~~~~~~");

        String email = principal.getName();

        BabyGrowInfoDTO babyGrowInfoDTO = babyGrowInfoService.getBabyGrowInfo(babyGrowNo, email);

        return babyGrowInfoDTO;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(@RequestBody BabyGrowInfoDTO babyGrowInfoDTO, Principal principal) {

        log.info("babyGrowInfo_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();;

        Long babyGrowNo = babyGrowInfoService.register(babyGrowInfoDTO, email);

        return Map.of("BabyGrowNo", babyGrowNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{babyGrowNo}")
    public Map<String, Long> remove(@PathVariable("babyGrowNo") Long babyGrowNo, Principal principal) {

        log.info("babyGrowInfo_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyGrowInfoService.remove(babyGrowNo, email);

        return Map.of("BabyGrowNo", babyGrowNo);

    }


}
