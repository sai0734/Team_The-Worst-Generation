package com.backend.diary.service;

import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.diary.domain.BabyDiary;
import com.backend.diary.dto.BabyDiaryDTO;
import com.backend.diary.mapper.BabyDiaryMapper;
import com.backend.global.ai.OllamaClient;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.backend.global.util.CustomFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    private final OllamaClient ollamaClient;

    private static final String DIARY_PROMPT =
            "너는 부모를 대신해서 아기 사진을 보고 짧은 육아일기를 써주는 역할이야. "
                    + "사진 속 상황을 보고, 오늘 하루 있었던 일처럼 자연스럽고 따뜻한 한국어 문장으로 딱 한 문장만 써줘. "
                    + "사진에 없는 내용은 지어내지 말고, 사진에서 실제로 보이는 것 위주로 써줘. "
                    + "딱딱한 문체 말고, 부모가 직접 쓴 것 같은 편안한 말투로 써줘. "
                    + "같은 단어나 표현을 반복하지 말고, 한 문장을 쓰고 나면 그 이후에는 아무것도 쓰지 마.";

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

        BabyDiary babyDiary = babyDiaryMapper.selectByDiaryNo(diaryNo, email);

        babyDiaryMapper.delete(diaryNo, email);

        if (babyDiary != null && babyDiary.getPhotoFileName() != null) {
            customFileUtil.deleteFiles(List.of(babyDiary.getPhotoFileName()));
        }

    }

    @Override
    public String generateDiaryContent(MultipartFile image) {

        log.info("babyDiary_Service_generateDiaryContent_실행~~~~~~~~~~~~");

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }

        return ollamaClient.chatWithImage(DIARY_PROMPT, imageBytes);

    }

}
