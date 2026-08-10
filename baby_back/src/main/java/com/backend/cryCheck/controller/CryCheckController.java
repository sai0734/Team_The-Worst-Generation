package com.backend.cryCheck.controller;

import com.backend.cryCheck.dto.CryCheckDTO;
import com.backend.cryCheck.service.CryCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cry-check")
@Log4j2
public class CryCheckController {

    private final CryCheckService cryCheckService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public CryCheckDTO analyze(@RequestBody CryCheckDTO cryCheckDTO, Principal principal) {

        log.info("cryCheck_Controller_analyze_실행~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.analyze(cryCheckDTO, email);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{cryCheckNo}")
    public CryCheckDTO get(@PathVariable Long cryCheckNo, Principal principal) {

        log.info("cryCheck_Controller_get_실행~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.get(cryCheckNo, email);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list/{babyNo}")
    public List<CryCheckDTO> getList(@PathVariable Long babyNo, Principal principal) {

        log.info("cryCheck_Controller_getList_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return cryCheckService.getList(babyNo, email);
    }
}
