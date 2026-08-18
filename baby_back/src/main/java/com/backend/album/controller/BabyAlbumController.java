package com.backend.album.controller;

import com.backend.album.dto.AlbumPhotoMetaDTO;
import com.backend.album.dto.BabyAlbumDTO;
import com.backend.album.service.BabyAlbumService;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/baby-album")
@Log4j2
public class BabyAlbumController {

    private final BabyAlbumService babyAlbumService;

    private final CustomFileUtil customFileUtil;

    private final ObjectMapper objectMapper;

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
    public Map<String, Object> register(
            BabyAlbumDTO babyAlbumDTO,
            @RequestParam(value = "metaJson", required = false) String metaJson,
            Principal principal
    ) {

        log.info("babyAlbum_Controller_register_실행~~~~~~~~~~~~");

        String email = principal.getName();

        List<MultipartFile> files = babyAlbumDTO.getFiles();

        List<String> uploadNames = customFileUtil.saveFiles(files);

        List<AlbumPhotoMetaDTO> metaList;
        try {
            metaList = metaJson != null
                    ? objectMapper.readValue(metaJson, new TypeReference<List<AlbumPhotoMetaDTO>>() {})
                    : List.of();
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("사진 정보 형식이 올바르지 않습니다.");
        }

        List<Long> albumNoList = new ArrayList<>();

        for (int i = 0; i < uploadNames.size(); i++) {
            babyAlbumDTO.setPhotoFileName(uploadNames.get(i));

            if (i < metaList.size()) {
                AlbumPhotoMetaDTO meta = metaList.get(i);
                babyAlbumDTO.setTakenDate(meta.getTakenDate());
                babyAlbumDTO.setLatitude(meta.getLatitude());
                babyAlbumDTO.setLongitude(meta.getLongitude());
            }

            Long albumNo = babyAlbumService.register(babyAlbumDTO, email);
            albumNoList.add(albumNo);
        }

        return Map.of("albumNoList", albumNoList);

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