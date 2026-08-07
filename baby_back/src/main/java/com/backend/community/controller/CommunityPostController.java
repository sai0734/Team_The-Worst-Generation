package com.backend.community.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.backend.community.dto.CommunityPostDTO;
import com.backend.community.dto.CommunityPostSearchDTO;
import com.backend.community.service.CommunityPostService;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/community/posts")
public class CommunityPostController {

    private final CommunityPostService communityPostService;

    private final CustomFileUtil fileUtil;

    @GetMapping("/files/{fileName}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileName) {

        return fileUtil.getFile(fileName);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(@RequestBody CommunityPostDTO postDTO, Principal principal) {

        postDTO.setWriterEmail(principal.getName());

        Long postNo = communityPostService.register(postDTO);

        return Map.of("postNo", postNo);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{postNo}/images")
    public Map<String, List<String>> addImages(
        @PathVariable Long postNo,
        @RequestParam("files") List<MultipartFile> files,
        Principal principal
    ) {

        List<String> savedNames = communityPostService.addImages(postNo, principal.getName(), files);

        return Map.of("fileNames", savedNames);
    }

    @GetMapping("/{postNo}")
    public CommunityPostDTO get(@PathVariable Long postNo) {

        return communityPostService.get(postNo);
    }

    @GetMapping("/{postNo}/summary")
    public Map<String, String> summary(@PathVariable Long postNo) {

        return Map.of("summary", communityPostService.summarize(postNo));
    }

    @GetMapping("/list")
    public PageResponseDTO<CommunityPostDTO> list(CommunityPostSearchDTO searchDTO) {

        return communityPostService.getList(searchDTO);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{postNo}")
    public Map<String, String> modify(
        @PathVariable Long postNo,
        @RequestBody CommunityPostDTO postDTO,
        Principal principal
    ) {

        postDTO.setPostNo(postNo);

        communityPostService.modify(postDTO, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{postNo}")
    public Map<String, String> remove(@PathVariable Long postNo, Principal principal) {

        communityPostService.remove(postNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
