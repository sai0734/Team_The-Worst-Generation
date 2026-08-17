package com.backend.cryCheck.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.cryCheck.domain.CryCheck;
import com.backend.cryCheck.dto.CryCheckDTO;
import com.backend.cryCheck.mapper.CryCheckMapper;
import com.backend.global.ai.OllamaClient;
import com.backend.global.util.CustomFileUtil;
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
public class CryCheckServiceImpl implements CryCheckService {

    // 아기 울음의 평균 기본 주파수는 대체로 이 범위 안에 있다고 판단
    // 이 범위를 벗어나면 AI 호출 없이 바로 "울음소리로 보기 어려움" 처리
    private static final double MIN_PITCH_HZ = 200;
    private static final double MAX_PITCH_HZ = 1000;
    private static final double MIN_DURATION_SEC = 1.0;

    private static final String NOT_A_CRY_RESULT =
            "{\"candidates\":[],\"notice\":\"울음소리로 보기 어려운 소리입니다. 다시 녹음해 주세요.\"}";

    private final CryCheckMapper cryCheckMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final OllamaClient ollamaClient;

    private final CustomFileUtil fileUtil;

    private final ModelMapper modelMapper;

    @Override
    public CryCheckDTO analyze(CryCheckDTO cryCheckDTO, String email) {

        log.info("cryCheck_Service_analyze_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(cryCheckDTO.getBabyNo(), email);

        if (babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + cryCheckDTO.getBabyNo());
        }

        // 울음소리로 보기 어려우면 AI 호출도 안 하고, 파일 저장도 안 하고(고아 파일 방지), 기록에도 안 남김
        if (!isLikelyCry(cryCheckDTO)) {
            return CryCheckDTO.builder()
                    .babyNo(cryCheckDTO.getBabyNo())
                    .avgPitch(cryCheckDTO.getAvgPitch())
                    .avgVolume(cryCheckDTO.getAvgVolume())
                    .durationSeconds(cryCheckDTO.getDurationSeconds())
                    .pattern(cryCheckDTO.getPattern())
                    .aiResultJson(NOT_A_CRY_RESULT)
                    .build();
        }

        // 여기부터는 진짜 울음소리로 판단된 것만 오므로 이때 처음으로 파일을 저장함
        String audioFileName = null;
        if (cryCheckDTO.getFile() != null) {
            List<String> savedNames = fileUtil.saveFiles(List.of(cryCheckDTO.getFile()));
            audioFileName = savedNames.get(0);
        }

        String aiResultJson = ollamaClient.chat(buildPrompt(cryCheckDTO));

        CryCheck cryCheck = CryCheck.builder()
                .babyNo(cryCheckDTO.getBabyNo())
                .avgPitch(cryCheckDTO.getAvgPitch())
                .avgVolume(cryCheckDTO.getAvgVolume())
                .durationSeconds(cryCheckDTO.getDurationSeconds())
                .pattern(cryCheckDTO.getPattern())
                .aiResultJson(aiResultJson)
                .audioFileName(audioFileName)
                .build();

        cryCheckMapper.insert(cryCheck);

        return modelMapper.map(cryCheck, CryCheckDTO.class);
    }

    @Override
    public CryCheckDTO get(Long cryCheckNo, String email) {

        log.info("cryCheck_Service_get_실행~~~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(cryCheckNo, email);

        if (cryCheck == null) {
            throw new IllegalArgumentException("존재하지 않는 분석 기록입니다: " + cryCheckNo);
        }

        return modelMapper.map(cryCheck, CryCheckDTO.class);
    }

    @Override
    public List<CryCheckDTO> getList(Long babyNo, String email) {

        log.info("cryCheck_Service_getList_실행~~~~~~~~~~");

        List<CryCheck> result = cryCheckMapper.selectListByBaby(babyNo, email);

        return result.stream()
                .map(cryCheck -> modelMapper.map(cryCheck, CryCheckDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public void submitFeedback(Long cryCheckNo, String userFeedback, String email) {

        log.info("cryCheck_Service_submitFeedback_실행~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(cryCheckNo, email);

        if (cryCheck == null) {
            throw new IllegalArgumentException("존재하지 않는 분석 기록입니다: " + cryCheckNo);
        }

        cryCheckMapper.updateFeedback(cryCheckNo, userFeedback);
    }

    @Override
    public String remove(Long cryCheckNo, String email) {

        log.info("cryCheck_Service_remove_실행~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(cryCheckNo, email);

        if (cryCheck == null) {
            throw new IllegalArgumentException("존재하지 않는 분석 기록입니다: " + cryCheckNo);
        }

        cryCheckMapper.delete(cryCheckNo);

        return cryCheck.getAudioFileName();
    }

    // 피치/길이가 아기 울음소리의 일반적인 범위를 벗어나면 AI 호출 전에 거름
    private boolean isLikelyCry(CryCheckDTO cryCheckDTO) {

        Double pitch = cryCheckDTO.getAvgPitch();
        Double duration = cryCheckDTO.getDurationSeconds();

        if (pitch == null || duration == null) {
            return false;
        }

        if (pitch < MIN_PITCH_HZ || pitch > MAX_PITCH_HZ) {
            return false;
        }

        if (duration < MIN_DURATION_SEC) {
            return false;
        }

        return true;
    }

    private String buildPrompt(CryCheckDTO cryCheckDTO) {

        StringBuilder sb = new StringBuilder();

        sb.append("다음은 아기 울음소리를 분석한 음향 특징이다.\n");
        sb.append("이 정보만으로 원인을 확정할 수 없으므로, 원인을 하나로 단정하지 말고 ")
                .append("의심되는 원인을 전부 순위별로 제시하라.\n");
        sb.append("각 원인마다 확신 정도를 0~100 사이의 정수 confidence 값으로 추정하라. ")
                .append("모든 candidate의 confidence 합이 100에 가깝게 배분하라.\n");
        sb.append("평균 피치: ").append(cryCheckDTO.getAvgPitch()).append("Hz\n");
        sb.append("평균 크기: ").append(cryCheckDTO.getAvgVolume()).append("\n");
        sb.append("울음 지속시간: ").append(cryCheckDTO.getDurationSeconds()).append("초\n");
        sb.append("울음 패턴: ").append(cryCheckDTO.getPattern()).append("\n");
        sb.append("아래 JSON 형식으로만 응답하라. 설명을 추가하지 마라.\n");
        sb.append("{\"candidates\":[{\"rank\":1,\"cause\":\"원인\",\"confidence\":78,\"reason\":\"이유\"}, ...]}");

        return sb.toString();
    }
}
