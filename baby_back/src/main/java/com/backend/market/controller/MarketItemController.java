package com.backend.market.controller;

import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import com.backend.market.domain.MarketItem;
import com.backend.market.dto.MarketItemDTO;
import com.backend.market.service.MarketItemService;
import org.springframework.core.io.Resource;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
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

    // 내 위치(lat, lng) 기준 반경 radiusKm(기본 5km) 안의 거래가능 매물, 가까운 순
    // category/keyword는 선택값 - 목록 화면에서 카테고리 칩/검색창 필터를 서버에서 처리
    @GetMapping("/nearby")
    public List<MarketItemDTO> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5") double radiusKm,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword
    ) {
        return marketItemService.getNearby(lat, lng, radiusKm, category, keyword);
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

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/mine")
    public List<MarketItemDTO> mine(Principal principal) {
        return marketItemService.getMine(principal.getName());
    }

    // 상세페이지 사이드바 "판매자의 다른 매물"용. getMine과 같은 로직이지만
    // principal이 아니라 아무 이메일이나 조회 가능 (다른 사람 매물 목록을 보는 거라 본인 확인 불필요)
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/by-seller/{email}")
    public List<MarketItemDTO> bySeller(@PathVariable String email) {
        return marketItemService.getMine(email);
    }

    // 거래완료는 구매자만 가능 - ChatRoomController의 /api/market/chat/rooms/{roomNo}/complete로 이동함

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {
        return fileUtil.getFile(fileName);
    }
}
