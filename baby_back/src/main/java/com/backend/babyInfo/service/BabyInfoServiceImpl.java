package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.BabyInfoDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyInfoServiceImpl implements BabyInfoService{


    @Override
    public List<BabyInfoDTO> getList(String email) {
        return List.of();
    }

    @Override
    public BabyInfoDTO getBabyInfo(Long babyNo) {
        return null;
    }

    @Override
    public Long register(BabyInfoDTO babyInfoDTO) {
        return 0L;
    }

    @Override
    public void modify(BabyInfoDTO babyInfoDTO) {

    }

    @Override
    public void remove(Long babyNo) {

    }
}
