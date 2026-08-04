package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyInfoDTO;

import java.util.List;

public interface BabyInfoService {

    List<BabyInfoDTO> getList(String email);

    BabyInfoDTO getBabyInfo(Long babyNo);

    Long register(BabyInfoDTO babyInfoDTO);

    void modify(BabyInfoDTO babyInfoDTO);

    void remove(Long babyNo);

}
