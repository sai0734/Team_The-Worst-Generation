package com.backend.babyInfo.service;

import com.backend.babyInfo.domain.BabyGrowInfo;
import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.dto.BabyGrowInfoDTO;
import com.backend.babyInfo.mapper.BabyGrowInfoMapper;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyGrowInfoServiceImpl implements BabyGrowInfoService{

    private final BabyGrowInfoMapper babyGrowInfoMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<BabyGrowInfoDTO> getList(Long babyNo, String email) {

        log.info("babyGrowInfo_Service_getList_실행~~~~~~~~~~~~");

        List<BabyGrowInfo> result = babyGrowInfoMapper.selectList(babyNo, email);

        List<BabyGrowInfoDTO> babyGrowInfoDTOList = result.stream()
                .map(babyGrowInfo -> modelMapper.map(babyGrowInfo, BabyGrowInfoDTO.class))
                .collect(Collectors.toList());

        return babyGrowInfoDTOList;

    }

    @Override
    public BabyGrowInfoDTO getBabyGrowInfo(Long babyGrowNo, String email) {

        log.info("babyGrowInfo_Service_getBabyGrowInfo_실행~~~~~~~~~~~~");

        BabyGrowInfo babyGrowInfo = babyGrowInfoMapper.selectByBabyGrowNo(babyGrowNo, email);

        if(babyGrowInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 성장 정보 입니다: " + babyGrowNo);
        }

        BabyGrowInfoDTO babyGrowInfoDTO = modelMapper.map(babyGrowInfo, BabyGrowInfoDTO.class);

        return babyGrowInfoDTO;

    }

    @Override
    public Long register(BabyGrowInfoDTO babyGrowInfoDTO, String email) {

        log.info("babyGrowInfo_Service_register_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyGrowInfoDTO.getBabyNo(), email);

        if(babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyGrowInfoDTO.getBabyNo());
        }

        BabyGrowInfo babyGrowInfo = modelMapper.map(babyGrowInfoDTO, BabyGrowInfo.class);

        babyGrowInfoMapper.insert(babyGrowInfo);

        return babyGrowInfo.getBabyGrowNo();

    }

    @Override
    public void remove(Long babyGrowNo, String email) {

        log.info("babyGrowInfo_Service_remove_실행~~~~~~~~~~~~");

        babyGrowInfoMapper.remove(babyGrowNo, email);

    }

    @Override
    public void removeAll(Long babyNo, String email) {

        log.info("babyGrowInfo_Service_removeAll_실행~~~~~~~~~~~~");

        babyGrowInfoMapper.removeByBabyNo(babyNo, email);

    }

}
