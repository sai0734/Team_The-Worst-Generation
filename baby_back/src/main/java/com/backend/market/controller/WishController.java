package com.backend.market.controller;

import com.backend.market.dto.WishDTO;
import com.backend.market.service.WishService;
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
@RequestMapping("/api/market/wish")
public class WishController {

    private final WishService wishService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/")
    public List<WishDTO> getMyList(Principal principal) { return wishService.getListByMember(principal.getName()); }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{itemNo}")
    public Map<String, Boolean> toggle(@PathVariable Long itemNo, Principal principal) {

        boolean wished = wishService.toggle(itemNo, principal.getName());

        return Map.of("wished", wished);
    }

    @GetMapping("/{itemNo}/count")
    public Map<String, Long> count(@PathVariable Long itemNo) {
        return Map.of("count", wishService.countByItem(itemNo));
    }
}
