package com.backend.crycheck.service;

import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.crycheck.domain.CryCheck;
import com.backend.crycheck.dto.CryCheckDTO;
import com.backend.crycheck.mapper.CryCheckMapper;
import com.backend.global.ai.OllamaClient;
import com.backend.global.util.CustomFileUtil;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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

    // 일반적인 아기 울음소리로 보기 위한 최소 조건.
    // 피치, 볼륨, 녹음 길이가 조건을 벗어나면Ollama를 호출하지 않고 울음이 아닌 것으로 처리한다.
    private static final double MIN_PITCH_HZ = 200;
    private static final double MAX_PITCH_HZ = 1000;
    private static final double MIN_VOLUME = 3.0;
    private static final double MIN_DURATION_SEC = 1.0;

    // 울음소리로 보기 어려운 경우 반환할 결과.
    private static final String NOT_A_CRY_RESULT =
            "{\"candidates\":[],"
                    + "\"notice\":\"울음소리로 보기 어려운 소리입니다. "
                    + "주변 소음을 줄이고 다시 녹음해 주세요.\"}";

    // Ollama가 올바른 JSON을 반환하지 못했을 때 사용할 결과.
    private static final String INVALID_AI_RESULT =
            "{\"candidates\":[],"
                    + "\"notice\":\"분석 결과를 생성하지 못했습니다. 다시 시도해 주세요.\"}";

    private final CryCheckMapper cryCheckMapper;

    private final BabyInfoMapper babyInfoMapper;

    private final OllamaClient ollamaClient;

    private final CustomFileUtil fileUtil;

    private final ModelMapper modelMapper;

    // 울음소리 분석
    @Override
    public CryCheckDTO analyze(CryCheckDTO cryCheckDTO, String email) {

        log.info("cryCheck_Service_analyze_실행~~~~~~~~~~~~");

        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(
                cryCheckDTO.getBabyNo(),
                email
        );

        if (babyInfo == null) {
            throw new IllegalArgumentException(
                    "존재하지 않는 아이입니다: " + cryCheckDTO.getBabyNo()
            );
        }

        // 피치, 볼륨, 길이를 확인하여 울음소리로 보기 어려우면 AI를 호출하거나 파일을 저장하지 않고 바로 결과를 반환한다.
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

        // 울음소리로 판단된 경우에만 다시 듣기용 파일을 저장한다.
        String audioFileName = null;

        if (cryCheckDTO.getFile() != null
                && !cryCheckDTO.getFile().isEmpty()) {

            List<String> savedNames = fileUtil.saveFiles(
                    List.of(cryCheckDTO.getFile())
            );

            if (!savedNames.isEmpty()) {
                audioFileName = savedNames.get(0);
            }
        }

        // 추출된 음향 특징과 아기 개월수를 이용해 Ollama에 울음 원인 분석을 요청한다.
        String rawAiResult = ollamaClient.chat(
                buildPrompt(cryCheckDTO, babyInfo)
        );

        // Ollama가 코드 블록이나 추가 문장을 반환하더라도 JSON 객체만 추출하여 저장한다.
        String aiResultJson = cleanJsonResponse(rawAiResult);

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

    // 울음소리 분석 기록 단건 조회
    @Override
    public CryCheckDTO get(Long cryCheckNo, String email) {

        log.info("cryCheck_Service_get_실행~~~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(
                cryCheckNo,
                email
        );

        if (cryCheck == null) {
            throw new IllegalArgumentException(
                    "존재하지 않는 분석 기록입니다: " + cryCheckNo
            );
        }

        return modelMapper.map(cryCheck, CryCheckDTO.class);
    }

    // 선택한 아이의 울음소리 분석 기록 목록 조회
    @Override
    public List<CryCheckDTO> getList(Long babyNo, String email) {

        log.info("cryCheck_Service_getList_실행~~~~~~~~~~");

        List<CryCheck> result =
                cryCheckMapper.selectListByBaby(babyNo, email);

        return result.stream()
                .map(cryCheck ->
                        modelMapper.map(cryCheck, CryCheckDTO.class))
                .collect(Collectors.toList());
    }

    // 보호자가 알려준 실제 울음 원인 저장
    @Override
    public void submitFeedback(
            Long cryCheckNo,
            String userFeedback,
            String email
    ) {

        log.info("cryCheck_Service_submitFeedback_실행~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(
                cryCheckNo,
                email
        );

        if (cryCheck == null) {
            throw new IllegalArgumentException(
                    "존재하지 않는 분석 기록입니다: " + cryCheckNo
            );
        }

        if (userFeedback == null || userFeedback.isBlank()) {
            throw new IllegalArgumentException(
                    "피드백 내용을 입력해 주세요."
            );
        }

        cryCheckMapper.updateFeedback(
                cryCheckNo,
                userFeedback.trim()
        );
    }

    // 울음소리 분석 기록 삭제
    @Override
    public String remove(Long cryCheckNo, String email) {

        log.info("cryCheck_Service_remove_실행~~~~~~~~~~");

        CryCheck cryCheck = cryCheckMapper.selectByCheckNo(
                cryCheckNo,
                email
        );

        if (cryCheck == null) {
            throw new IllegalArgumentException(
                    "존재하지 않는 분석 기록입니다: " + cryCheckNo
            );
        }

        cryCheckMapper.delete(cryCheckNo);

        // 실제 파일 삭제는 Controller에서 처리할 수 있도록저장된 파일명을 반환한다.
        return cryCheck.getAudioFileName();
    }

    // 피치, 볼륨, 녹음 길이를 이용한 사전 검사.
    // 일반적인 아기 울음 범위를 벗어나는 소리는 AI에 전달하지 않는다.
    private boolean isLikelyCry(CryCheckDTO cryCheckDTO) {

        Double pitch = cryCheckDTO.getAvgPitch();
        Double volume = cryCheckDTO.getAvgVolume();
        Double duration = cryCheckDTO.getDurationSeconds();

        if (pitch == null || volume == null || duration == null) {
            return false;
        }

        if (!Double.isFinite(pitch)
                || !Double.isFinite(volume)
                || !Double.isFinite(duration)) {
            return false;
        }

        if (pitch < MIN_PITCH_HZ || pitch > MAX_PITCH_HZ) {
            return false;
        }

        if (volume < MIN_VOLUME) {
            return false;
        }

        return duration >= MIN_DURATION_SEC;
    }

    // Ollama에 전달할 울음소리 분석 프롬프트 생성.
    private String buildPrompt(
            CryCheckDTO cryCheckDTO,
            BabyInfo babyInfo
    ) {

        Integer ageMonths = calculateAgeMonths(
                babyInfo.getBirthDate()
        );

        String ageText = ageMonths != null
                ? ageMonths + "개월"
                : "정보 없음";

        return """
                너는 영유아 울음소리의 음향 특징을 분석하여
                가능한 울음 원인을 추정하는 육아 보조 AI다.

                이 결과는 의료 진단이 아니라 보호자가 울음 원인을
                확인할 때 참고할 수 있도록 제공하는 추정 결과다.

                [입력 정보]
                - 아기 개월수: %s
                - 평균 피치: %sHz
                - 평균 볼륨: %s/100
                - 울음 지속시간: %s초
                - 울음 변화 패턴: %s

                [분석 후보]

                반드시 다음 5개 후보만 사용하라.

                1. 배고픔
                2. 졸림
                3. 일반적인 불편함
                4. 통증 또는 강한 불편
                5. 정서적 필요

                [후보별 참고 기준]

                - 배고픔
                  반복적이고 일정한 리듬으로 울거나 시간이 지나면서
                  점차 강해지는 경향이 있다.
                  일정형 또는 상승형 패턴을 주요 근거로 참고한다.
                  개월수는 보조 근거로만 사용한다.

                - 졸림
                  칭얼거리듯 비교적 약하고 늘어지는 경향이 있다.
                  낮거나 중간 정도의 볼륨과 하강형 패턴을
                  주요 근거로 참고한다.

                - 일반적인 불편함
                  기저귀, 온도, 자세, 트림 등으로 인해 나타날 수 있다.
                  강도의 변화가 있거나 불규칙하지만 극단적으로 높은
                  피치가 뚜렷하지 않을 때 고려한다.

                - 통증 또는 강한 불편
                  갑작스러운 높은 피치, 큰 볼륨, 불규칙한 패턴이
                  함께 나타날 때 가능성을 높인다.
                  한 가지 특징만 일치하는 경우에는 높은 확신도를
                  부여하지 않는다.

                - 정서적 필요
                  안아달라는 요구나 불안 등으로 인해 나타날 수 있다.
                  다른 원인을 강하게 지지하는 특징이 없을 때 고려한다.
                  단순히 판단이 어렵다는 이유만으로
                  1순위로 선택하지 않는다.

                [판단 절차]

                1. 각 후보와 일치하는 음향 특징을 확인한다.
                2. 각 후보와 맞지 않는 음향 특징도 함께 확인한다.
                3. 하나의 수치만으로 원인을 결정하지 않는다.
                4. 아기 개월수는 보조 근거로만 사용한다.
                5. 입력되지 않은 수유 시간, 수면 시간, 체온 등의
                   정보는 추측하지 않는다.
                6. 가능성이 높은 후보를 최대 3개까지 출력한다.

                [확신도 규칙]

                - confidence는 0부터 100 사이의 정수다.
                - 출력된 모든 confidence의 합은 반드시 정확히 100이어야 한다.
                - confidence가 높은 순서대로 rank를 지정한다.
                - 두 가지 이상의 특징이 명확하게 일치할 때만
                  한 후보에 60 이상의 confidence를 부여한다.
                - 특징이 애매하거나 서로 충돌하면
                  1순위도 50 이하로 지정한다.
                - 후보 간 차이가 명확하지 않으면
                  confidence를 비슷하게 배분한다.
                - confidence가 10 미만인 후보는 출력하지 않는다.
                - 입력 정보에 없는 사실을 만들어내지 않는다.

                [reason 작성 규칙]

                - 실제 입력된 피치, 볼륨, 지속시간, 패턴 중
                  판단 근거가 된 값을 구체적으로 언급한다.
                - 해당 후보를 선택한 이유를 설명한다.
                - 확정적인 진단 표현을 사용하지 않는다.
                - "~입니다"보다 "~일 가능성이 있습니다"라고 작성한다.
                - 보호자가 확인할 수 있는 행동을 마지막에 짧게 제안한다.
                - 한 후보의 reason은 두 문장을 넘기지 않는다.

                [출력 규칙]

                반드시 JSON 객체 하나만 출력하라.
                마크다운 코드 블록과 JSON 이외의 설명을 출력하지 마라.
                cause에는 위에서 제시한 후보 이름을 그대로 사용하라.
                candidates 배열 이외의 임의 필드를 추가하지 마라.

                다음 형식을 정확하게 지켜라.

                {
                  "candidates": [
                    {
                      "rank": 1,
                      "cause": "배고픔",
                      "confidence": 50,
                      "reason": "평균 피치와 일정형 패턴을 고려하면 배고픔일 가능성이 있습니다. 마지막 수유 시간을 확인해 보세요."
                    },
                    {
                      "rank": 2,
                      "cause": "졸림",
                      "confidence": 30,
                      "reason": "비교적 낮은 볼륨을 고려하면 졸림 가능성도 있습니다. 최근 수면 시간을 확인해 보세요."
                    },
                    {
                      "rank": 3,
                      "cause": "정서적 필요",
                      "confidence": 20,
                      "reason": "다른 원인을 확정할 특징이 부족하여 정서적 필요 가능성도 있습니다."
                    }
                  ]
                }
                """.formatted(
                ageText,
                cryCheckDTO.getAvgPitch(),
                cryCheckDTO.getAvgVolume(),
                cryCheckDTO.getDurationSeconds(),
                cryCheckDTO.getPattern()
        );
    }

    // Ollama 응답에서 JSON 객체만 추출하고 프론트에서 사용할 수 있는 형식인지 확인한다.
    private String cleanJsonResponse(String rawResult) {

        if (rawResult == null || rawResult.isBlank()) {
            log.warn("울음 분석 AI 응답이 비어 있습니다.");
            return INVALID_AI_RESULT;
        }

        String trimmedResult = rawResult.trim();

        // 모델이 JSON 앞뒤에 설명이나 코드 블록을 붙인 경우첫 번째 { 부터 마지막 }까지 추출한다.
        int startIndex = trimmedResult.indexOf('{');
        int endIndex = trimmedResult.lastIndexOf('}');

        if (startIndex < 0 || endIndex <= startIndex) {
            log.warn("울음 분석 AI 응답에서 JSON을 찾지 못했습니다: {}",
                    trimmedResult);

            return INVALID_AI_RESULT;
        }

        String jsonText = trimmedResult.substring(
                startIndex,
                endIndex + 1
        );

        try {
            JsonElement parsedElement = JsonParser.parseString(jsonText);

            if (!parsedElement.isJsonObject()) {
                log.warn("울음 분석 AI 응답이 JSON 객체가 아닙니다.");
                return INVALID_AI_RESULT;
            }

            JsonObject jsonObject = parsedElement.getAsJsonObject();

            // 프론트에서는 candidates 배열을 기준으로 결과를 출력하므로 candidates가 없거나 배열이 아니면 잘못된 응답으로 처리한다.
            if (!jsonObject.has("candidates")
                    || !jsonObject.get("candidates").isJsonArray()) {

                log.warn("울음 분석 AI 응답에 candidates 배열이 없습니다.");
                return INVALID_AI_RESULT;
            }

            // JSON을 Gson으로 다시 문자열화하여 코드 블록이나 불필요한 공백이 없는 JSON만 저장한다.
            return jsonObject.toString();

        } catch (Exception e) {
            log.warn(
                    "울음 분석 AI JSON 파싱 실패: {}",
                    e.getMessage()
            );

            return INVALID_AI_RESULT;
        }
    }

    // 생년월일을 기준으로 현재 만 개월수를 계산한다.
    private Integer calculateAgeMonths(LocalDate birthDate) {

        if (birthDate == null) {
            return null;
        }

        Period age = Period.between(
                birthDate,
                LocalDate.now()
        );

        int ageMonths = age.getYears() * 12 + age.getMonths();

        // 잘못된 미래 생년월일이 들어간 경우 음수가 되지 않게 한다.
        return Math.max(ageMonths, 0);
    }
}
