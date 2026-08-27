package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyGrowInfoDTO;

import java.util.List;

public interface BabyGrowInfoService {

    List<BabyGrowInfoDTO> getList(Long babyNo, String email);

    BabyGrowInfoDTO getBabyGrowInfo(Long babyGrowNo, String email);

    Long register(BabyGrowInfoDTO babyGrowInfoDTO, String email);

    void remove(Long babyGrowNo, String email);

}
