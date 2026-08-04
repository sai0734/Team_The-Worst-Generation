package com.backend.babyInfo.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.dto.BabyInfoDTO;
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
public class BabyInfoServiceImpl implements BabyInfoService{

    private final BabyInfoMapper babyInfoMapper;

    private final BabyGrowInfoMapper babyGrowInfoMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<BabyInfoDTO> getList(String email) {

        log.info("babyInfo_Service_getList_실행~~~~~~~~~~~~");

        List<BabyInfo> result = babyInfoMapper.selectList(email);

        List<BabyInfoDTO> babyInfoDTOList = result.stream()
                .map(babyInfo -> modelMapper.map(babyInfo, BabyInfoDTO.class))
                .collect(Collectors.toList());

        return  babyInfoDTOList;

    }

    @Override
    public BabyInfoDTO getBabyInfo(Long babyNo) {

        log.info("babyInfo_Service_getBabyInfo_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo);

        if(babyInfo == null ) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        BabyInfoDTO babyInfoDTO = modelMapper.map(babyInfo, BabyInfoDTO.class);

        return babyInfoDTO;

    }

    @Override
    public Long register(BabyInfoDTO babyInfoDTO) {

        log.info("babyInfo_Service_register_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = modelMapper.map(babyInfoDTO, BabyInfo.class);

        babyInfoMapper.insert(babyInfo);

        return babyInfo.getBabyNo();

    }

    @Override
    public void modify(BabyInfoDTO babyInfoDTO) {

        log.info("babyInfo_Service_modify_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyInfoDTO.getBabyNo());

        if(babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다:" + babyInfoDTO.getBabyNo());
        }

        babyInfo.changeName(babyInfoDTO.getBabyName());
        babyInfo.changeGender(babyInfoDTO.getGender());
        babyInfo.changeBirthDate(babyInfoDTO.getBirthDate());
        babyInfo.changeBloodType(babyInfoDTO.getBloodType());
        babyInfo.changeBirthWeekCount(babyInfoDTO.getBirthWeekCount());
        babyInfo.changeProfileImageFileName(babyInfoDTO.getProfileImageFileName());

        babyInfoMapper.update(babyInfo);

    }

    @Override
    public void remove(Long babyNo) {

        log.info("babyInfo_Service_remove_실행~~~~~~~~~~~~");

        babyGrowInfoMapper.removeByBabyNo(babyNo);

        babyInfoMapper.delete(babyNo);

    }
}
