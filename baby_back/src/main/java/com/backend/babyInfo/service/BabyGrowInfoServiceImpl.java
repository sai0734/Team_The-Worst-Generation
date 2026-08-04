package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyGrowInfoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyGrowInfoServiceImpl implements BabyGrowInfoService{
    @Override
    public List<BabyGrowInfoDTO> getList(Long babyNo) {
        return List.of();
    }

    @Override
    public BabyGrowInfoDTO getBabyGrowInfo(Long babyGrowNo) {
        return null;
    }

    @Override
    public Long register(BabyGrowInfoDTO babyGrowInfoDTO) {
        return 0L;
    }

    @Override
    public void remove(Long babyGrowNo) {

    }
}
