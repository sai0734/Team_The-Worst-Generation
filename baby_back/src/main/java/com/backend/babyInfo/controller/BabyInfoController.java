package com.backend.babyInfo.controller;

import com.backend.babyInfo.dto.BabyInfoDTO;
import com.backend.babyInfo.service.BabyInfoService;
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
@RequestMapping("/api/baby-info")
@Log4j2
public class BabyInfoController {

    private final BabyInfoService babyInfoService;

    private final CustomFileUtil customFileUtil;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list")
    public List<BabyInfoDTO> list(Principal principal) {

        log.info("babyInfo_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<BabyInfoDTO> babyInfoDTOList = babyInfoService.getList(email);

        return babyInfoDTOList;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/{babyNo}")
    public BabyInfoDTO get(@PathVariable(name = "babyNo") Long babyNo, Principal principal) {

        log.info("babyInfo_Controller_get_실행~~~~~~~~~~~~");

        String email = principal.getName();

        BabyInfoDTO babyInfoDTO = babyInfoService.getBabyInfo(babyNo, email);

        return babyInfoDTO;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(BabyInfoDTO babyInfoDTO, Principal principal) {

        log.info("babyInfo_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<MultipartFile> files = babyInfoDTO.getFiles();

        List<String> uploadNames = customFileUtil.saveFiles(files);

        if(uploadNames != null && !uploadNames.isEmpty()) {

            babyInfoDTO.setProfileImageFileName(uploadNames.get(0));

        }

        Long babyNo = babyInfoService.register(babyInfoDTO, email);

        return Map.of("BabyNo", babyNo);

    }
    
    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFileGet(@PathVariable("fileName") String fileName) {

        log.info("babyInfo_Controller_viewFileGet_실행~~~~~~~~~~~~");

        ResponseEntity<Resource> view = customFileUtil.getFile(fileName);

        return view;

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{babyNo}")
    public Map<String, Long> modify(@PathVariable("babyNo") Long babyNo, BabyInfoDTO babyInfoDTO, Principal principal) {

        log.info("babyInfo_Controller_modify_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyInfoDTO.setBabyNo(babyNo);

        BabyInfoDTO oldBabyInfoDTO = babyInfoService.getBabyInfo(babyNo, email);

        List<MultipartFile> files = babyInfoDTO.getFiles();

        List<String> currentUploadFileNames = customFileUtil.saveFiles(files);

        if (currentUploadFileNames != null && !currentUploadFileNames.isEmpty()) {

            babyInfoDTO.setProfileImageFileName(currentUploadFileNames.get(0));

            if (oldBabyInfoDTO.getProfileImageFileName() != null) {
                customFileUtil.deleteFiles(List.of(oldBabyInfoDTO.getProfileImageFileName()));
            }

        } else {
            babyInfoDTO.setProfileImageFileName(oldBabyInfoDTO.getProfileImageFileName());
        }

        babyInfoService.modify(babyInfoDTO, email);

        return Map.of("BabyNo", babyInfoDTO.getBabyNo());

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{babyNo}")
    public Map<String, Long> remove(@PathVariable("babyNo") Long babyNo, Principal principal) {

        log.info("babyInfo_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyInfoService.remove(babyNo, email);

        return Map.of("BabyNo", babyNo);

    }

}


