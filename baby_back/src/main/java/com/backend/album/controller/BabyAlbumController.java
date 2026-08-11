package com.backend.album.controller;

import com.backend.album.dto.BabyAlbumDTO;
import com.backend.album.service.BabyAlbumService;
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
@RequestMapping("/api/baby-album")
@Log4j2
public class BabyAlbumController {

    private final BabyAlbumService babyAlbumService;

    private final CustomFileUtil customFileUtil;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/list")
    public PageResponseDTO<BabyAlbumDTO> list(@RequestParam("babyNo") Long babyNo,
                                              @RequestParam(value = "sort", required = false) String sort,
                                              PageRequestDTO pageRequestDTO,
                                              Principal principal) {

        log.info("babyAlbum_Controller_list_실행~~~~~~~~~~~~");

        String email = principal.getName();

        return babyAlbumService.getList(babyNo, email, sort, pageRequestDTO);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(BabyAlbumDTO babyAlbumDTO, Principal principal) {

        log.info("babyAlbum_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<MultipartFile> files = babyAlbumDTO.getFiles();

        List<String> uploadNames = customFileUtil.saveFiles(files);

        if (uploadNames != null && !uploadNames.isEmpty()) {
            babyAlbumDTO.setPhotoFileName(uploadNames.get(0));
        }

        Long albumNo = babyAlbumService.register(babyAlbumDTO, email);

        return Map.of("albumNo", albumNo);

    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{albumNo}")
    public Map<String, Long> remove(@PathVariable("albumNo") Long albumNo, Principal principal) {

        log.info("babyAlbum_Controller_remove_실행~~~~~~~~~~~~");

        String email = principal.getName();

        babyAlbumService.remove(albumNo, email);

        return Map.of("albumNo", albumNo);

    }

    @GetMapping("/view/{fileName}")
    public ResponseEntity<Resource> viewFileGet(@PathVariable("fileName") String fileName) {

        log.info("babyAlbum_Controller_viewFileGet_실행~~~~~~~~~~~~");

        return customFileUtil.getFile(fileName);

    }

}