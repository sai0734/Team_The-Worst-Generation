package com.backend.community.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.backend.community.dto.CommunityPostDTO;
import com.backend.community.dto.CommunityPostSearchDTO;
import com.backend.global.dto.PageResponseDTO;

public interface CommunityPostService {

    Long register(CommunityPostDTO postDTO);

    CommunityPostDTO get(Long postNo);

    PageResponseDTO<CommunityPostDTO> getList(CommunityPostSearchDTO searchDTO);

    void modify(CommunityPostDTO postDTO, String email);

    void remove(Long postNo, String email);

    List<String> addImages(Long postNo, String email, List<MultipartFile> files);

    void removeImage(Long postNo, String email, String fileName);

    String summarize(Long postNo);
}
