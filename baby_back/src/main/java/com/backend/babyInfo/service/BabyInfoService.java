package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyInfoDTO;

import java.util.List;

public interface BabyInfoService {

    List<BabyInfoDTO> getList(String email);

    BabyInfoDTO getBabyInfo(Long babyNo, String email);

    Long register(BabyInfoDTO babyInfoDTO, String email);

    void modify(BabyInfoDTO babyInfoDTO, String email);

    void remove(Long babyNo, String email);
}
