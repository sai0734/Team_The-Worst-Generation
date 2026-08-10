package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.dto.BabysitterJobPostDTO;
import com.backend.babysitter.dto.BabysitterJobSearchDTO;
import com.backend.babysitter.service.BabysitterJobPostService;
import com.backend.global.dto.PageResponseDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/jobs")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterJobPostController {

    private final BabysitterJobPostService babysitterJobPostService;

    @PostMapping("/")
    public Map<String, Long> register(@RequestBody BabysitterJobPostDTO jobPostDTO, Principal principal) {

        jobPostDTO.setParentEmail(principal.getName());

        Long jobNo = babysitterJobPostService.register(jobPostDTO);

        return Map.of("jobNo", jobNo);
    }

    @GetMapping("/list")
    public PageResponseDTO<BabysitterJobPostDTO> list(BabysitterJobSearchDTO searchDTO) {

        return babysitterJobPostService.getList(searchDTO);
    }

    @GetMapping("/mine")
    public List<BabysitterJobPostDTO> mine(Principal principal) {

        return babysitterJobPostService.getMyJobPosts(principal.getName());
    }

    @GetMapping("/{jobNo}")
    public BabysitterJobPostDTO get(@PathVariable Long jobNo) {

        return babysitterJobPostService.get(jobNo);
    }

    @PutMapping("/{jobNo}/cancel")
    public Map<String, String> cancel(@PathVariable Long jobNo, Principal principal) {

        babysitterJobPostService.cancel(jobNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
