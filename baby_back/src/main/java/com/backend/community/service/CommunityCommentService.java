package com.backend.community.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.backend.community.dto.CommunityCommentDTO;

public interface CommunityCommentService {

    Long register(CommunityCommentDTO commentDTO);

    List<CommunityCommentDTO> listByPost(Long postNo);

    void modify(CommunityCommentDTO commentDTO, String email);

    void remove(Long commentNo, String email);

    List<String> addImages(Long commentNo, String email, List<MultipartFile> files);
}
