package com.backend.diary.service;

import com.backend.diary.dto.BabyDiaryDTO;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;

public interface BabyDiaryService {

    PageResponseDTO<BabyDiaryDTO> getList(Long babyNo, String email, PageRequestDTO pageRequestDTO);

    Long register(BabyDiaryDTO babyDiaryDTO, String email);

    void modify(BabyDiaryDTO babyDiaryDTO, String email);

    void remove(Long diaryNo, String email);

}