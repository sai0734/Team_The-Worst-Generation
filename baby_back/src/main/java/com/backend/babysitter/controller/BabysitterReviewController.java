package com.backend.babysitter.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.babysitter.dto.BabysitterReviewDTO;
import com.backend.babysitter.service.BabysitterReviewService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/reviews")
public class BabysitterReviewController {

    private final BabysitterReviewService babysitterReviewService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(@RequestBody BabysitterReviewDTO reviewDTO, Principal principal) {

        Long reviewNo = babysitterReviewService.register(reviewDTO, principal.getName());

        return Map.of("reviewNo", reviewNo);
    }

    @GetMapping("/sitter/{sitterEmail}")
    public List<BabysitterReviewDTO> listBySitter(@PathVariable String sitterEmail) {

        return babysitterReviewService.listBySitter(sitterEmail);
    }
}
