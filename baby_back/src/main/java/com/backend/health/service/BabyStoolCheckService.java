package com.backend.health.service;

import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.health.ai.PythonVisionClient;
import com.backend.health.domain.BabyStoolCheck;
import com.backend.health.mapper.BabyStoolCheckMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BabyStoolCheckService implements BabyStoolCheckServiceImpl {

    private final PythonVisionClient visionClient;
    private final BabyStoolCheckMapper babyStoolCheckMapper;
    private final BabyInfoMapper babyInfoMapper;

    private static final String PROMPT =
            "너는 아기 대변 사진을 보고 상태를 짧게 알려주는 역할이야. "
                    + "색깔과 농도를 보고 판단해줘. "
                    + "형식은 반드시 다음 세 줄만 지켜:\n"
                    + "상태: (색깔·농도 한 문장)\n"
                    + "판정: 정상 / 주의 필요\n"
                    + "대처법: (판정이 정상이면 \"특별한 조치 필요 없음\", "
                    + "주의 필요면 수분 보충, 이유식 조절 등 가정에서 바로 해볼 수 있는 대처 1~2가지를 간단히 적고, "
                    + "혈변·점액변이거나 증상이 지속되면 소아과 진료를 권장한다는 말을 짧게 덧붙여)\n"
                    + "다른 설명, 배경 이야기, 의학적 진단 단정은 절대 하지 마.";

    @Override
    public BabyStoolCheck checkStool(Long babyNo, MultipartFile image, String email) {

        verifyOwner(babyNo, email);

        byte[] imageBytes = readImageBytes(image);

        String aiResult = visionClient.chatWithImage(PROMPT, imageBytes);

        BabyStoolCheck babyStoolCheck = new BabyStoolCheck();
        babyStoolCheck.setBabyNo(babyNo);
        babyStoolCheck.setImageFileName(image.getOriginalFilename());
        babyStoolCheck.setAiResult(aiResult);

        babyStoolCheckMapper.insertCheck(babyStoolCheck);

        return babyStoolCheck;
    }

    @Override
    public List<BabyStoolCheck> getHistory(Long babyNo, String email) {
        verifyOwner(babyNo, email);
        return babyStoolCheckMapper.selectByBabyNo(babyNo);
    }

    private void verifyOwner(Long babyNo, String email) {
        if (babyInfoMapper.selectByBabyNo(babyNo, email) == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + babyNo);
        }
    }

    private byte[] readImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }
    }
}