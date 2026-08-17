package com.backend.diary.service;

import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.diary.domain.BabyDiary;
import com.backend.diary.dto.BabyDiaryDTO;
import com.backend.diary.mapper.BabyDiaryMapper;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class BabyDiaryServiceImpl implements BabyDiaryService{

    private final BabyDiaryMapper babyDiaryMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final ModelMapper modelMapper;

    private final CustomFileUtil customFileUtil;

    @Override
    public PageResponseDTO<BabyDiaryDTO> getList(Long babyNo, String email, PageRequestDTO pageRequestDTO, String keyword) {

        log.info("babyDiary_Service_getList_실행~~~~~~~~~~~~");

        int skip =  (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize();

        List<BabyDiary> result = babyDiaryMapper.selectList(babyNo, email, skip, pageRequestDTO.getSize(), keyword);

        List<BabyDiaryDTO> babyDiaryDTOList = result.stream().map(diary -> modelMapper.map(diary, BabyDiaryDTO.class))
                .collect(Collectors.toList());

        long totalCount = babyDiaryMapper.selectListCount(babyNo, email, keyword);

        PageResponseDTO<BabyDiaryDTO> dtoList = PageResponseDTO.<BabyDiaryDTO>withAll()
                .dtoList(babyDiaryDTOList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();

        return  dtoList;

    }

    @Override
    public Long register(BabyDiaryDTO babyDiaryDTO, String email) {

        log.info("babyDiary_Service_register_실행~~~~~~~~~~~~");

        if(babyInfoMapper.selectByBabyNo(babyDiaryDTO.getBabyNo(), email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다.");
        }

        BabyDiary babyDiary = BabyDiary.builder()
                .babyNo(babyDiaryDTO.getBabyNo())
                .diaryDate(
                        babyDiaryDTO.getDiaryDate() != null
                                ? babyDiaryDTO.getDiaryDate()
                                : LocalDate.now()
                )
                .photoFileName(babyDiaryDTO.getPhotoFileName())
                .content(babyDiaryDTO.getContent())
                .build();

        babyDiaryMapper.insert(babyDiary);

        return babyDiary.getDiaryNo();

    }

    @Override
    public void modify(BabyDiaryDTO babyDiaryDTO, String email) {

        log.info("babyDiary_Service_modify_실행~~~~~~~~~~~~");

        BabyDiary babyDiary = babyDiaryMapper.selectByDiaryNo(babyDiaryDTO.getDiaryNo(), email);

        if (babyDiary == null) {
            throw new IllegalArgumentException("존재하지 않는 일기입니다: " + babyDiaryDTO.getDiaryNo());
        }

        String oldPhotoFileName = babyDiary.getPhotoFileName();
        String newPhotoFileName = babyDiaryDTO.getPhotoFileName();

        if(newPhotoFileName != null && oldPhotoFileName != null && !oldPhotoFileName.equals(newPhotoFileName)) {
            customFileUtil.deleteFiles(List.of(oldPhotoFileName));
        }

        babyDiary.changeContent(babyDiaryDTO.getContent());
        babyDiary.changePhotoFileName(newPhotoFileName != null ? newPhotoFileName : oldPhotoFileName);

        babyDiaryMapper.update(babyDiary, email);

    }

    @Override
    public void remove(Long diaryNo, String email) {

        log.info("babyDiary_Service_remove_실행~~~~~~~~~~~~");

        babyDiaryMapper.delete(diaryNo, email);

    }

}
