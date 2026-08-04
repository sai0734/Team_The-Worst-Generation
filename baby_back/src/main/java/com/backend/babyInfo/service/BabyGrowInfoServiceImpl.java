package com.backend.babyInfo.service;

import com.backend.babyInfo.domain.BabyGrowInfo;
import com.backend.babyInfo.dto.BabyGrowInfoDTO;
import com.backend.babyInfo.mapper.BabyGrowInfoMapper;
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

    private final ModelMapper modelMapper;

    @Override
    public List<BabyGrowInfoDTO> getList(Long babyNo) {

        log.info("babyGrowInfo_Service_getList_실행~~~~~~~~~~~~");

        List<BabyGrowInfo> result = babyGrowInfoMapper.selectList(babyNo);

        List<BabyGrowInfoDTO> babyGrowInfoDTOList = result.stream()
                .map(babyGrowInfo -> modelMapper.map(babyGrowInfo, BabyGrowInfoDTO.class))
                .collect(Collectors.toList());

        return babyGrowInfoDTOList;

    }

    @Override
    public BabyGrowInfoDTO getBabyGrowInfo(Long babyGrowNo) {

        log.info("babyGrowInfo_Service_getBabyGrowInfo_실행~~~~~~~~~~~~");

        BabyGrowInfo babyGrowInfo = babyGrowInfoMapper.selectByBabyGrowNo(babyGrowNo);

        if(babyGrowInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 성장 정보 입니다: " + babyGrowNo);
        }

        BabyGrowInfoDTO babyGrowInfoDTO = modelMapper.map(babyGrowInfo, BabyGrowInfoDTO.class);

        return babyGrowInfoDTO;

    }

    @Override
    public Long register(BabyGrowInfoDTO babyGrowInfoDTO) {

        log.info("babyGrowInfo_Service_register_실행~~~~~~~~~~~~");

        BabyGrowInfo babyGrowInfo = modelMapper.map(babyGrowInfoDTO, BabyGrowInfo.class);

        babyGrowInfoMapper.insert(babyGrowInfo);

        return babyGrowInfo.getBabyGrowNo();

    }

    @Override
    public void remove(Long babyGrowNo) {

        log.info("babyGrowInfo_Service_remove_실행~~~~~~~~~~~~");

        babyGrowInfoMapper.remove(babyGrowNo);

    }
}
