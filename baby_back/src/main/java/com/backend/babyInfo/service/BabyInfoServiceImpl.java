package com.backend.babyInfo.service;

import com.backend.album.mapper.BabyAlbumMapper;
import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.dto.BabyInfoDTO;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.diary.mapper.BabyDiaryMapper;
import com.backend.global.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyInfoServiceImpl implements BabyInfoService{

    private final BabyInfoMapper babyInfoMapper;

    private final BabyDiaryMapper babyDiaryMapper;

    private final BabyAlbumMapper babyAlbumMapper;

    private final ModelMapper modelMapper;

    private final CustomFileUtil customFileUtil;

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
    public BabyInfoDTO getBabyInfo(Long babyNo, String email) {

        log.info("babyInfo_Service_getBabyInfo_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo, email);

        if(babyInfo == null ) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }

        BabyInfoDTO babyInfoDTO = modelMapper.map(babyInfo, BabyInfoDTO.class);

        return babyInfoDTO;

    }

    @Override
    public Long register(BabyInfoDTO babyInfoDTO, String email) {

        log.info("babyInfo_Service_register_실행~~~~~~~~~~~~");

        validateRequiredFields(babyInfoDTO);

        BabyInfo babyInfo = modelMapper.map(babyInfoDTO, BabyInfo.class);

        babyInfoMapper.insert(babyInfo, email);

        return babyInfo.getBabyNo();

    }

    @Override
    public void modify(BabyInfoDTO babyInfoDTO, String email) {

        log.info("babyInfo_Service_modify_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyInfoDTO.getBabyNo(), email);

        if(babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다:" + babyInfoDTO.getBabyNo());
        }

        validateRequiredFields(babyInfoDTO);

        babyInfo.changeName(babyInfoDTO.getBabyName());
        babyInfo.changeGender(babyInfoDTO.getGender());
        babyInfo.changeBirthDate(babyInfoDTO.getBirthDate());
        babyInfo.changeBloodType(babyInfoDTO.getBloodType());
        babyInfo.changeBirthWeekCount(babyInfoDTO.getBirthWeekCount());
        babyInfo.changeBirthWeight(babyInfoDTO.getBirthWeight());
        babyInfo.changeBirthHeight(babyInfoDTO.getBirthHeight());
        babyInfo.changeHeadCircumference(babyInfoDTO.getHeadCircumference());
        babyInfo.changeProfileImageFileName(babyInfoDTO.getProfileImageFileName());

        babyInfoMapper.update(babyInfo, email);

    }

    // 6개 Mapper 개별 호출 대신 deleteCascade() 한 번으로 18개 테이블 삭제
    @Override
    public void remove(Long babyNo, String email) {

        log.info("babyInfo_Service_remove_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(babyNo, email);

        List<String> photoFileNames = new ArrayList<>();

        if (babyInfo != null && babyInfo.getProfileImageFileName() != null) {
            photoFileNames.add(babyInfo.getProfileImageFileName());
        }

        // DB 캐스케이드는 물리 파일까지는 못 지우므로, row가 지워지기 전에 파일명부터 수집
        photoFileNames.addAll(babyDiaryMapper.selectPhotoFileNamesByBabyNo(babyNo, email));
        photoFileNames.addAll(babyAlbumMapper.selectPhotoFileNamesByBabyNo(babyNo, email));

        babyInfoMapper.deleteCascadeGrandchildren(babyNo, email);
        babyInfoMapper.deleteCascade(babyNo, email);
        babyInfoMapper.delete(babyNo, email);

        customFileUtil.deleteFiles(photoFileNames);

    }

    private void validateRequiredFields(BabyInfoDTO babyInfoDTO) {
        if(babyInfoDTO.getBabyName() == null || babyInfoDTO.getBabyName().isEmpty()
                || babyInfoDTO.getBirthDate() == null || babyInfoDTO.getGender() == null || babyInfoDTO.getGender().isEmpty()) {
            throw new IllegalArgumentException("이름, 생년월일, 성별은 필수 입력 항목입니다.");

        }

        if ((babyInfoDTO.getBirthWeekCount() != null && babyInfoDTO.getBirthWeekCount() < 0)
                || (babyInfoDTO.getBirthWeight() != null && babyInfoDTO.getBirthWeight() < 0)
                || (babyInfoDTO.getBirthHeight() != null && babyInfoDTO.getBirthHeight() < 0)
                || (babyInfoDTO.getHeadCircumference() != null && babyInfoDTO.getHeadCircumference() < 0)) {
            throw new IllegalArgumentException("출생 주수/체중/키/머리둘레는 0 이상이어야 합니다.");
        }
    }
}
