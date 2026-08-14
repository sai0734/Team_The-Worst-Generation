package com.backend.recall.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.backend.global.util.CustomFileUtil;
import com.backend.recall.dto.MyProductDTO;
import com.backend.recall.dto.RecallOcrResultDTO;
import com.backend.recall.service.MyProductService;
import com.backend.recall.service.RecallOcrService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/recall/my-products")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class MyProductController {

    private final MyProductService myProductService;

    private final RecallOcrService recallOcrService;

    private final CustomFileUtil customFileUtil;

    @PreAuthorize("permitAll()")
    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFileGet(@PathVariable("fileName") String fileName) {
        return customFileUtil.getFile(fileName);
    }

    @PostMapping
    public MyProductDTO register(@RequestBody MyProductDTO dto, Principal principal) {
        return myProductService.register(principal.getName(), dto);
    }

    @PutMapping("/{productNo}")
    public MyProductDTO update(
        @PathVariable Long productNo,
        @RequestBody MyProductDTO dto,
        Principal principal
    ) {
        return myProductService.update(productNo, principal.getName(), dto);
    }

    @PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RecallOcrResultDTO extractFromImage(@RequestParam("image") MultipartFile image) {
        return recallOcrService.extract(image);
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
