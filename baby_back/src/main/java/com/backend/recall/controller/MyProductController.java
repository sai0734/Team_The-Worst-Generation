package com.backend.recall.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.backend.recall.dto.MyProductDTO;
import com.backend.recall.service.MyProductService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/recall/my-products")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class MyProductController {

    private final MyProductService myProductService;

    @PostMapping
    public MyProductDTO register(@RequestBody MyProductDTO dto, Principal principal) {
        return myProductService.register(principal.getName(), dto);
    }

    @GetMapping
    public List<MyProductDTO> listMine(Principal principal) {
        return myProductService.listMine(principal.getName());
    }

    @DeleteMapping("/{productNo}")
    public void remove(@PathVariable Long productNo, Principal principal) {
        myProductService.remove(productNo, principal.getName());
    }
}
