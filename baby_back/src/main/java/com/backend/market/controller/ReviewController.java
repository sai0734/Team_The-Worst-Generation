package com.backend.market.controller;

import com.backend.market.dto.ReviewDTO;
import com.backend.market.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/market/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{targetEmail}")
    public List<ReviewDTO> getList(@PathVariable String targetEmail) {
        return reviewService.getListByTarget(targetEmail);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(@RequestBody ReviewDTO reviewDTO, Principal principal) {

        reviewDTO.setWriterEmail(principal.getName());

        Long reviewNo = reviewService.register(reviewDTO);

        return Map.of("result", reviewNo);
    }
}
