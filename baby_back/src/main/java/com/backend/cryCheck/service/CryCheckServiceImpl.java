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

import java.time.LocalDate;
import java.time.Period;
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

        String aiResultJson = ollamaClient.chat(buildPrompt(cryCheckDTO, babyInfo));

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

    private String buildPrompt(CryCheckDTO cryCheckDTO, BabyInfo babyInfo) {

        StringBuilder sb = new StringBuilder();

        sb.append("너는 영유아 울음소리 음향 특징을 보고 원인을 추정하는 육아 보조 AI다.\n");
        sb.append("아래 [아기 정보]와 [음향 특징]을 바탕으로, [판단 기준]에 제시된 경향을 참고해서 추론하라.\n");
        sb.append("[판단 기준]은 절대적인 규칙이 아니라 참고용 경향이니, 수치가 애매하면 여러 원인의 confidence를 비슷하게 배분해도 된다.\n\n");

        sb.append("[아기 정보]\n");
        Integer ageMonths = calculateAgeMonths(babyInfo.getBirthDate());
        if (ageMonths != null) {
            sb.append("개월수: 약 ").append(ageMonths).append("개월\n");
        } else {
            sb.append("개월수: 정보 없음\n");
        }
        sb.append('\n');

        sb.append("[음향 특징]\n");
        sb.append("평균 피치: ").append(cryCheckDTO.getAvgPitch()).append("Hz\n");
        sb.append("평균 크기(0~100): ").append(cryCheckDTO.getAvgVolume()).append("\n");
        sb.append("울음 지속시간: ").append(cryCheckDTO.getDurationSeconds()).append("초\n");
        sb.append("울음 패턴: ").append(cryCheckDTO.getPattern())
                .append(" (불규칙/상승형/하강형/일정형 중 하나)\n\n");

        sb.append("[판단 기준 - 참고용 경향]\n");
        sb.append("- 배고픔: 리드미컬하고 반복적인 패턴(일정형 또는 상승형), 피치가 중간~약간 높은 편이며 ")
                .append("시간이 지날수록 강도가 세지는 경향. 생후 개월수가 어릴수록(신생아~3개월) 수유 간격이 짧아 배고픔 빈도가 상대적으로 높다.\n");
        sb.append("- 졸림/수면 신호: 칭얼거리듯 약하고 늘어지는 소리, 하강형 패턴, 피치와 볼륨이 상대적으로 낮은 편. ")
                .append("울다가 중간에 끊기거나 잦아드는 경향.\n");
        sb.append("- 불편함 또는 통증: 전조 없이 갑자기 시작되고 피치가 매우 높고 날카로우며 불규칙 패턴, ")
                .append("강하고 급격한 볼륨 변화. 생후 6~8주 전후 영아는 원인을 특정하기 힘든 장시간 울음(콜릭)이 흔하고 보통 3~4개월이면 줄어든다.\n");
        sb.append("- 정서적 필요(안아달라/불안 등): 위 세 가지처럼 극단적인 음향 특징이 뚜렷하지 않고 애매한 경우, ")
                .append("또는 음향 특징만으로 다른 원인을 특정할 근거가 약할 때 고려하라.\n\n");

        sb.append("이 정보만으로 원인을 확정할 수 없으므로, 원인을 하나로 단정하지 말고 ")
                .append("의심되는 원인을 전부 순위별로 제시하라.\n");
        sb.append("각 원인마다 확신 정도를 0~100 사이의 정수 confidence 값으로 추정하라. ")
                .append("모든 candidate의 confidence 합이 100에 가깝게 배분하라.\n");
        sb.append("reason에는 위 음향 특징과 개월수 중 실제로 근거가 된 값을 구체적으로 언급하라. 근거 없이 일반론만 쓰지 마라.\n");
        sb.append("아래 JSON 형식으로만 응답하라. 설명을 추가하지 마라.\n");
        sb.append("{\"candidates\":[{\"rank\":1,\"cause\":\"원인\",\"confidence\":78,\"reason\":\"이유\"}, ...]}");

        return sb.toString();
    }

    // 생년월일 기준 만 개월수 계산. 생년월일 미입력 시 null
    private Integer calculateAgeMonths(LocalDate birthDate) {

        if (birthDate == null) {
            return null;
        }

        return Period.between(birthDate, LocalDate.now()).getYears() * 12
                + Period.between(birthDate, LocalDate.now()).getMonths();
    }
}
