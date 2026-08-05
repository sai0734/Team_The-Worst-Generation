package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyGrowInfoDTO;

import java.util.List;

public interface BabyGrowInfoService {

    List<BabyGrowInfoDTO> getList(Long babyNo);

    BabyGrowInfoDTO getBabyGrowInfo(Long babyGrowNo);

    Long register(BabyGrowInfoDTO babyGrowInfoDTO);

    void remove(Long babyGrowNo);

    void removeAll(Long babyNo);

}
