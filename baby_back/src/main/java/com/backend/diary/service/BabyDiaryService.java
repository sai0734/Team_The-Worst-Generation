package com.backend.diary.service;

import com.backend.diary.dto.BabyDiaryDTO;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface BabyDiaryService {

    PageResponseDTO<BabyDiaryDTO> getList(Long babyNo, String email, PageRequestDTO pageRequestDTO, String keyword);

    Long register(BabyDiaryDTO babyDiaryDTO, String email);

    void modify(BabyDiaryDTO babyDiaryDTO, String email);

    void remove(Long diaryNo, String email);

    String generateDiaryContent(MultipartFile image);

}