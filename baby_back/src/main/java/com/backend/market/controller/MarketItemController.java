package com.backend.market.controller;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import com.backend.market.domain.MarketItem;
import com.backend.market.dto.MarketItemDTO;
import com.backend.market.service.MarketItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/market/items")
public class MarketItemController {

    private final MarketItemService marketItemService;

    private final CustomFileUtil fileUtil;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(MarketItemDTO marketItemDTO, Principal principal) {

        marketItemDTO.setSellerEmail(principal.getName());

        List<MultipartFile> files = marketItemDTO.getFiles();
        List<String> uploadFileNames = fileUtil.saveFiles(files);
        marketItemDTO.setUploadFileNames(uploadFileNames);

        Long itemNo = marketItemService.register(marketItemDTO);

        return Map.of("result", itemNo);
    }

    @GetMapping("/{itemNo}")
    public MarketItemDTO read(@PathVariable Long itemNo) {

        marketItemService.increaseViewCount(itemNo);

        return marketItemService.get(itemNo);
    }

    @GetMapping("/list")
    public PageResponseDTO<MarketItemDTO> list(PageRequestDTO pageRequestDTO) {
        return marketItemService.getList(pageRequestDTO);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{itemNo}")
    public Map<String, String> modify(@PathVariable Long itemNo, MarketItemDTO marketItemDTO, Principal principal) {

        marketItemDTO.setItemNo(itemNo);

        MarketItemDTO oldDTO = marketItemService.get(itemNo);
        List<String> oldFileNames = oldDTO.getUploadFileNames();

        List<MultipartFile> files = marketItemDTO.getFiles();
        List<String> currentUploadFileNames = fileUtil.saveFiles(files);

        List<String> uploadedFileNames = marketItemDTO.getUploadFileNames();
        if (currentUploadFileNames != null && !currentUploadFileNames.isEmpty()) {
            uploadedFileNames.addAll(currentUploadFileNames);
        }

        marketItemService.modify(marketItemDTO, principal.getName());

        if (oldFileNames != null && !oldFileNames.isEmpty()) {
            List<String> removeFiles = oldFileNames.stream()
                    .filter(fileName -> uploadedFileNames.indexOf(fileName) == -1)
                    .collect(Collectors.toList());
            fileUtil.deleteFiles(removeFiles);
        }

        return Map.of("result", "success");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{itemNo}")
    public Map<String, String> remove(@PathVariable Long itemNo, Principal principal) {

        List<String> oldFileNames = marketItemService.get(itemNo).getUploadFileNames();

        marketItemService.remove(itemNo, principal.getName());

        fileUtil.deleteFiles(oldFileNames);

        return Map.of("result", "success");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{itemNo}/bump")
    public Map<String, String> bump(@PathVariable Long itemNo) {

        marketItemService.bump(itemNo);

        return Map.of("result", "success");
    }
}
