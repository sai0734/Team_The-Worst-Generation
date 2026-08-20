package com.backend.diary.controller;

import com.backend.diary.dto.BabyDiaryDTO;
import com.backend.diary.service.BabyDiaryService;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/diary")
@Log4j2
public class BabyDiaryController {

    private final BabyDiaryService babyDiaryService;

    private final CustomFileUtil customFileUtil;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list")
    public PageResponseDTO<BabyDiaryDTO> list(@RequestParam("babyNo") Long babyNo, @RequestParam(value = "keyword", required = false) String keyword,
                                              PageRequestDTO pageRequestDTO, Principal principal) {

        log.info("babyDiary_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        PageResponseDTO<BabyDiaryDTO> babyDiaryDTOPageResponseDTO = babyDiaryService.getList(babyNo, email, pageRequestDTO, keyword);

        return babyDiaryDTOPageResponseDTO;

    }

    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFileGet(@PathVariable("fileName") String fileName) {

        log.info("babyDiary_Controller_viewFileGet_실행~~~~~~~~~~~~");

        return customFileUtil.getFile(fileName);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(BabyDiaryDTO babyDiaryDTO, Principal principal) {

        log.info("babyDiary_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<MultipartFile> files = babyDiaryDTO.getFiles();

        List<String> uploadNames = customFileUtil.saveFiles(files);

        if(uploadNames != null && !uploadNames.isEmpty()) {
            babyDiaryDTO.setPhotoFileName(uploadNames.get(0));
        }

        Long diaryNo = babyDiaryService.register(babyDiaryDTO, email);

        return Map.of("diaryNo", diaryNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{diaryNo}")
    public Map<String, Long> modify(@PathVariable("diaryNo") Long diaryNo,
                                    BabyDiaryDTO babyDiaryDTO,
                                    @RequestParam(value = "removePhoto", required = false) Boolean removePhoto,
                                    Principal principal) {

        log.info("babyDiary_Controller_modify_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyDiaryDTO.setDiaryNo(diaryNo);

        List<MultipartFile> files = babyDiaryDTO.getFiles();

        List<String> uploadNames = customFileUtil.saveFiles(files);

        if (uploadNames != null && !uploadNames.isEmpty()) {
            babyDiaryDTO.setPhotoFileName(uploadNames.get(0));
        } else if (Boolean.TRUE.equals(removePhoto)) {
            babyDiaryDTO.setPhotoFileName("");
        } else {
            babyDiaryDTO.setPhotoFileName(null);
        }

        babyDiaryService.modify(babyDiaryDTO, email);

        return Map.of("diaryNo", diaryNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{diaryNo}")
    public Map<String, Long> remove(@PathVariable("diaryNo") Long diaryNo, Principal principal) {

        log.info("babyDiary_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyDiaryService.remove(diaryNo, email);

        return Map.of("diaryNo", diaryNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/generate")
    public Map<String, String> generate(@RequestParam("file") MultipartFile file) {

        log.info("babyDiary_Controller_generate_실행~~~~~~~~~~~~");

        String content = babyDiaryService.generateDiaryContent(file);

        return Map.of("content", content);

    }
}
