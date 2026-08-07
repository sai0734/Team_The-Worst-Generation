package com.backend.community.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.backend.community.dto.CommunityCommentDTO;
import com.backend.community.service.CommunityCommentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/community/posts/{postNo}/comments")
public class CommunityCommentController {

    private final CommunityCommentService communityCommentService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/")
    public Map<String, Long> register(
        @PathVariable Long postNo,
        @RequestBody CommunityCommentDTO commentDTO,
        Principal principal
    ) {

        commentDTO.setPostNo(postNo);
        commentDTO.setWriterEmail(principal.getName());

        Long commentNo = communityCommentService.register(commentDTO);

        return Map.of("commentNo", commentNo);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{commentNo}/images")
    public Map<String, List<String>> addImages(
        @PathVariable Long postNo,
        @PathVariable Long commentNo,
        @RequestParam("files") List<MultipartFile> files,
        Principal principal
    ) {

        List<String> savedNames = communityCommentService.addImages(commentNo, principal.getName(), files);

        return Map.of("fileNames", savedNames);
    }

    @GetMapping("/")
    public List<CommunityCommentDTO> list(@PathVariable Long postNo) {

        return communityCommentService.listByPost(postNo);
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{commentNo}")
    public Map<String, String> modify(
        @PathVariable Long postNo,
        @PathVariable Long commentNo,
        @RequestBody CommunityCommentDTO commentDTO,
        Principal principal
    ) {

        commentDTO.setCommentNo(commentNo);

        communityCommentService.modify(commentDTO, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @DeleteMapping("/{commentNo}")
    public Map<String, String> remove(
        @PathVariable Long postNo,
        @PathVariable Long commentNo,
        Principal principal
    ) {

        communityCommentService.remove(commentNo, principal.getName());

        return Map.of("RESULT", "SUCCESS");
    }
}
