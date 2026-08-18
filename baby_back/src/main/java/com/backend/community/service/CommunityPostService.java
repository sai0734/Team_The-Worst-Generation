package com.backend.community.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.backend.community.dto.CommunityPostDTO;
import com.backend.community.dto.CommunityPostSearchDTO;
import com.backend.global.dto.PageResponseDTO;

public interface CommunityPostService {

    Long register(CommunityPostDTO postDTO);

    // viewerEmail은 로그인 안 했으면 null - 이 경우 liked는 항상 false로 내려간다.
    CommunityPostDTO get(Long postNo, String viewerEmail);

    PageResponseDTO<CommunityPostDTO> getList(CommunityPostSearchDTO searchDTO);

    // 공감 토글. 반환값은 토글 후 상태(true = 공감함).
    boolean toggleLike(Long postNo, String memberEmail);

    void modify(CommunityPostDTO postDTO, String email);

    void remove(Long postNo, String email);

    List<String> addImages(Long postNo, String email, List<MultipartFile> files);

    void removeImage(Long postNo, String email, String fileName);

    String summarize(Long postNo);
}
