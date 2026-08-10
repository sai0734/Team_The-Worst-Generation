package com.backend.sleep.service;

import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.sleep.domain.BabySleep;
import com.backend.sleep.dto.BabySleepDTO;
import com.backend.sleep.mapper.BabySleepMapper;
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
public class BabySleepServiceImpl implements BabySleepService {

    private final BabySleepMapper babySleepMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<BabySleepDTO> getList(Long babyNo, String email) {

        log.info("babySleep_Service_getList_실행~~~~~~~~~~~~");

        List<BabySleep> result = babySleepMapper.selectList(babyNo, email);

        List<BabySleepDTO> babySleepDTOList = result.stream()
                .map(sleep -> modelMapper.map(sleep, BabySleepDTO.class))
                .collect(Collectors.toList());

        return babySleepDTOList;

    }

    @Override
    public Long register(BabySleepDTO babySleepDTO, String email) {

        log.info("babySleep_Service_register_실행~~~~~~~~~~~~");

        if (babyInfoMapper.selectByBabyNo(babySleepDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babySleepDTO.getBabyNo());
        }

        BabySleep babySleep = modelMapper.map(babySleepDTO, BabySleep.class);

        babySleepMapper.insert(babySleep);

        return babySleep.getSleepNo();

    }

    @Override
    public void modify(BabySleepDTO babySleepDTO, String email) {

        log.info("babySleep_Service_modify_실행~~~~~~~~~~~~");

        BabySleep babySleep = babySleepMapper.selectBySleepNo(babySleepDTO.getSleepNo(), email);

        if (babySleep == null) {
            throw new IllegalArgumentException("존재하지 않는 수면기록입니다: " + babySleepDTO.getSleepNo());
        }

        babySleep.changeSleepType(babySleepDTO.getSleepType());
        babySleep.changeStartTime(babySleepDTO.getStartTime());
        babySleep.changeEndTime(babySleepDTO.getEndTime());

        babySleepMapper.update(babySleep, email);

    }

    @Override
    public void remove(Long sleepNo, String email) {

        log.info("babySleep_Service_remove_실행~~~~~~~~~~~~");

        babySleepMapper.delete(sleepNo, email);

    }

}