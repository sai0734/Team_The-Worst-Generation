package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.dto.BabysitterJobApplicationDTO;
import com.backend.babysitter.service.BabysitterJobApplicationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/jobs")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterJobApplicationController {

    private final BabysitterJobApplicationService babysitterJobApplicationService;

    @PostMapping("/{jobNo}/applications")
    public Map<String, Long> apply(
        @PathVariable Long jobNo,
        @RequestBody Map<String, String> body,
        Principal principal
    ) {

        Long applicationNo = babysitterJobApplicationService.apply(jobNo, principal.getName(), body.get("message"));

        return Map.of("applicationNo", applicationNo);
    }

    @GetMapping("/{jobNo}/applications")
    public List<BabysitterJobApplicationDTO> listByJob(@PathVariable Long jobNo, Principal principal) {

        return babysitterJobApplicationService.listByJob(jobNo, principal.getName());
    }

    @GetMapping("/applications/mine")
    public List<BabysitterJobApplicationDTO> mine(Principal principal) {

        return babysitterJobApplicationService.listBySitter(principal.getName());
    }

    @PutMapping("/{jobNo}/applications/{applicationNo}/accept")
    public Map<String, String> accept(
        @PathVariable Long jobNo,
        @PathVariable Long applicationNo,
        Principal principal
    ) {

        babysitterJobApplicationService.accept(applicationNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @PutMapping("/{jobNo}/applications/{applicationNo}/reject")
    public Map<String, String> reject(
        @PathVariable Long jobNo,
        @PathVariable Long applicationNo,
        Principal principal
    ) {

        babysitterJobApplicationService.reject(applicationNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
