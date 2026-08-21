package com.backend.aibeHavior.service;

import com.backend.aibeHavior.client.NaverNewsClient;
import com.backend.aibeHavior.client.YoutubeSearchClient;
import com.backend.aibeHavior.domain.BabyBehaviorConsult;
import com.backend.aibeHavior.domain.BabyBehaviorMessage;
import com.backend.aibeHavior.domain.BabyBehaviorSource;
import com.backend.aibeHavior.domain.BabyBehaviorStep;
import com.backend.aibeHavior.dto.BehaviorConsultRequest;
import com.backend.aibeHavior.dto.BehaviorConsultResponse;
import com.backend.aibeHavior.dto.BehaviorMessageDTO;
import com.backend.aibeHavior.dto.BehaviorMessageRequest;
import com.backend.aibeHavior.dto.BehaviorSourceDTO;
import com.backend.aibeHavior.dto.BehaviorStepDTO;
import com.backend.aibeHavior.mapper.BabyBehaviorConsultMapper;
import com.backend.aibeHavior.mapper.BabyBehaviorMessageMapper;
import com.backend.aibeHavior.mapper.BabyBehaviorSourceMapper;
import com.backend.aibeHavior.mapper.BabyBehaviorStepMapper;
import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.global.ai.OllamaClient;
import com.backend.global.dto.PageRequestDTO;
import com.backend.global.dto.PageResponseDTO;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class BehaviorServiceImpl implements BehaviorService {

    private final OllamaClient ollamaClient;

    private final NaverNewsClient naverNewsClient;

    private final YoutubeSearchClient youtubeSearchClient;

    private final BabyInfoMapper babyInfoMapper;

    private final BabyBehaviorConsultMapper consultMapper;

    private final BabyBehaviorStepMapper stepMapper;

    private final BabyBehaviorSourceMapper sourceMapper;

    private final BabyBehaviorMessageMapper messageMapper;

    private static final String KEYWORD_PROMPT =
            "너는 육아 상담 검색어를 뽑아주는 역할이야. "
                    + "아래 카테고리와 상황을 보고, 뉴스와 유튜브에서 검색할 핵심 키워드를 딱 하나만 만들어줘. "
                    + "설명이나 문장 없이 검색어 자체만 출력해. 따옴표도 붙이지 마.\n"
                    + "카테고리: %s\n"
                    + "상황: %s";

    private static final String ANSWER_PROMPT =
            "너는 육아 행동교정 상담사야. 아래 카테고리와 상황을 보고, "
                    + "실제로 오늘 당장 시도해볼 수 있는 구체적인 해결책을 제시해줘.\n"
                    + "카테고리: %s\n"
                    + "상황: %s\n\n"
                    + "참고 기사 후보 목록(번호. 제목 - 내용):\n%s\n\n"
                    + "아래 3가지 방법은 순서대로 진행하는 절차가 아니라, 서로 다른 독립적인 해결 방법이야. "
                    + "가장 효과적일 것 같은 방법부터 추천 순으로 나열해줘(1번이 가장 추천). "
                    + "title에는 '먼저', '그다음' 같은 순서를 암시하는 표현은 쓰지 말고, 그 방법 자체를 요약하는 제목만 써줘.\n"
                    + "아래 JSON 형식으로만 답하고, 다른 설명은 절대 붙이지 마.\n"
                    + "{\n"
                    + "  \"summary\": \"이 상황이 왜 일어나는지와 전반적인 대응 방향을 3~4문장으로 구체적으로 설명\",\n"
                    + "  \"steps\": [\n"
                    + "    {\"title\": \"1순위로 추천하는 방법의 제목\", \"description\": \"부모가 실제로 무엇을 어떻게 해야 하는지, 예시 상황이나 대사를 포함해서 2~3문장으로 구체적으로 설명\"},\n"
                    + "    {\"title\": \"2순위로 추천하는 방법의 제목\", \"description\": \"위와 같은 방식으로 2~3문장, 구체적으로\"},\n"
                    + "    {\"title\": \"3순위로 추천하는 방법의 제목\", \"description\": \"위와 같은 방식으로 2~3문장, 구체적으로\"}\n"
                    + "  ],\n"
                    + "  \"relevantIndices\": [상황과 실제로 관련 있는 기사 번호만, 없으면 빈 배열]\n"
                    + "}";

    private static final String VIDEO_PROMPT =
            "너는 육아 상담에 참고할 유튜브 영상을 고르는 역할이야. "
                    + "아래 상황에 가장 도움이 되는 영상 번호를 딱 하나만 골라줘.\n"
                    + "상황: %s\n\n"
                    + "영상 후보 목록(번호. 제목 - 채널명):\n%s\n\n"
                    + "아래 JSON 형식으로만 답하고, 다른 설명은 절대 붙이지 마. 적합한 영상이 없으면 -1을 넣어.\n"
                    + "{\"selectedIndex\": 번호}";

    private static final String FOLLOWUP_PROMPT =
            "너는 육아 행동교정 상담사야. 아래는 지금까지 나눈 상담 대화야. "
                    + "마지막 부모 질문에 이어서 답변해줘.\n"
                    + "카테고리: %s\n"
                    + "상황: %s\n"
                    + "이전 요약: %s\n\n"
                    + "대화 기록:\n%s\n"
                    + "친절하고 구체적으로, 한글로만, 600자 이내로 간결하게 답변해줘.";

    @Override
    public BehaviorConsultResponse createConsult(BehaviorConsultRequest request, String email) {

        log.info("behavior_Service_createConsult_실행~~~~~~~~~~~~");

        // 소유권 검증: 이 babyNo가 실제 이 email 소유인지 먼저 확인 (AI 호출 전에 걸러내기)
        BabyInfo babyInfo = babyInfoMapper.selectByBabyNo(request.getBabyNo(), email);
        if (babyInfo == null) {
            throw new IllegalArgumentException("존재하지 않는 아이입니다: " + request.getBabyNo());
        }

        // 1단계: qwen에게 category+situation을 주고 검색 키워드 추출
        String keywordPrompt = String.format(KEYWORD_PROMPT, request.getCategory(), request.getSituation());
        String keyword = chatWithRetry(keywordPrompt).trim();

        log.info("추출된 검색 키워드: " + keyword);

        // 2단계: 키워드로 네이버 뉴스 기사 후보 가져오기
        List<JsonObject> newsCandidates = naverNewsClient.search(keyword, 10);

        log.info("네이버 뉴스 후보 개수: " + newsCandidates.size());

        // 3단계: 기사 후보 중 관련있는 것만 필터링 + 최종 답변(요약+3단계) 생성
        StringBuilder candidateText = new StringBuilder();
        for (int i = 0; i < newsCandidates.size(); i++) {
            JsonObject c = newsCandidates.get(i);
            candidateText.append(i)
                    .append(". ")
                    .append(stripHtml(c.get("title").getAsString()))
                    .append(" - ")
                    .append(stripHtml(c.get("description").getAsString()))
                    .append("\n");
        }

        String answerPrompt = String.format(ANSWER_PROMPT, request.getCategory(), request.getSituation(), candidateText);
        JsonObject answerJson = chatJsonWithRetry(answerPrompt);

        String aiSummary = answerJson.get("summary").getAsString();

        List<BehaviorStepDTO> steps = new ArrayList<>();
        JsonArray stepsJson = answerJson.getAsJsonArray("steps");
        for (int i = 0; i < stepsJson.size(); i++) {
            JsonObject s = stepsJson.get(i).getAsJsonObject();
            steps.add(BehaviorStepDTO.builder()
                    .stepOrder(i + 1)
                    .title(s.get("title").getAsString())
                    .description(s.get("description").getAsString())
                    .build());
        }

        List<BehaviorSourceDTO> sources = new ArrayList<>();
        JsonArray relevantIndices = answerJson.getAsJsonArray("relevantIndices");
        for (int i = 0; i < relevantIndices.size(); i++) {
            int idx = relevantIndices.get(i).getAsInt();
            if (idx < 0 || idx >= newsCandidates.size()) {
                continue;
            }
            JsonObject c = newsCandidates.get(idx);
            sources.add(BehaviorSourceDTO.builder()
                    .title(stripHtml(c.get("title").getAsString()))
                    .link(c.get("link").getAsString())
                    .press(extractPress(c.get("originallink").getAsString()))
                    .pubDate(c.get("pubDate").getAsString())
                    .build());
        }

        log.info("AI 답변 생성 완료, 관련 기사 " + sources.size() + "개 선정");

        // 4단계: 키워드로 유튜브 영상 후보 가져오기
        List<JsonObject> videoCandidates = youtubeSearchClient.search(keyword, 5);

        log.info("유튜브 영상 후보 개수: " + videoCandidates.size());

        // 5단계: 영상 후보 중 가장 적합한 1개 선정
        String videoId = null;
        String videoTitle = null;

        if (!videoCandidates.isEmpty()) {
            StringBuilder videoText = new StringBuilder();
            for (int i = 0; i < videoCandidates.size(); i++) {
                JsonObject snippet = videoCandidates.get(i).getAsJsonObject("snippet");
                videoText.append(i)
                        .append(". ")
                        .append(snippet.get("title").getAsString())
                        .append(" - ")
                        .append(snippet.get("channelTitle").getAsString())
                        .append("\n");
            }

            String videoPrompt = String.format(VIDEO_PROMPT, request.getSituation(), videoText);
            JsonObject videoJson = chatJsonWithRetry(videoPrompt);
            int selectedIndex = videoJson.get("selectedIndex").getAsInt();

            if (selectedIndex >= 0 && selectedIndex < videoCandidates.size()) {
                JsonObject picked = videoCandidates.get(selectedIndex);
                videoId = picked.getAsJsonObject("id").get("videoId").getAsString();
                videoTitle = picked.getAsJsonObject("snippet").get("title").getAsString();
            }
        }

        log.info("선정된 영상: " + videoTitle);

        // 6단계: BabyBehaviorConsult/Step/Source DB insert (부모 먼저, 자식은 부모 PK 필요)
        BabyBehaviorConsult consult = BabyBehaviorConsult.builder()
                .babyNo(request.getBabyNo())
                .category(request.getCategory())
                .situation(request.getSituation())
                .aiSummary(aiSummary)
                .videoId(videoId)
                .videoTitle(videoTitle)
                .build();
        consultMapper.insert(consult);

        for (BehaviorStepDTO step : steps) {
            stepMapper.insert(BabyBehaviorStep.builder()
                    .consultNo(consult.getConsultNo())
                    .stepOrder(step.getStepOrder())
                    .title(step.getTitle())
                    .description(step.getDescription())
                    .build());
        }

        for (BehaviorSourceDTO source : sources) {
            sourceMapper.insert(BabyBehaviorSource.builder()
                    .consultNo(consult.getConsultNo())
                    .title(source.getTitle())
                    .link(source.getLink())
                    .press(source.getPress())
                    .pubDate(source.getPubDate())
                    .build());
        }

        // 7단계: BehaviorConsultResponse로 조립해서 반환 (reg_time은 DB 기본값이라 재조회해서 정확한 값 사용)
        BabyBehaviorConsult saved = consultMapper.selectByConsultNo(consult.getConsultNo(), email);

        return BehaviorConsultResponse.builder()
                .consultNo(saved.getConsultNo())
                .category(saved.getCategory())
                .situation(saved.getSituation())
                .aiSummary(saved.getAiSummary())
                .steps(steps)
                .sources(sources)
                .videoId(saved.getVideoId())
                .videoTitle(saved.getVideoTitle())
                .messages(List.of())
                .regTime(saved.getRegTime())
                .build();
    }

    @Override
    public BehaviorConsultResponse addMessage(BehaviorMessageRequest request, String email) {

        log.info("behavior_Service_addMessage_실행~~~~~~~~~~~~");

        BabyBehaviorConsult consult = consultMapper.selectByConsultNo(request.getConsultNo(), email);
        if (consult == null) {
            throw new IllegalArgumentException("존재하지 않는 상담입니다: " + request.getConsultNo());
        }

        messageMapper.insert(BabyBehaviorMessage.builder()
                .consultNo(consult.getConsultNo())
                .role("user")
                .content(request.getContent())
                .build());

        List<BabyBehaviorMessage> history = messageMapper.selectListByConsultNo(consult.getConsultNo());

        StringBuilder historyText = new StringBuilder();
        for (BabyBehaviorMessage m : history) {
            historyText.append("user".equals(m.getRole()) ? "부모: " : "상담사: ")
                    .append(m.getContent())
                    .append("\n");
        }

        String followupPrompt = String.format(FOLLOWUP_PROMPT,
                consult.getCategory(), consult.getSituation(), consult.getAiSummary(), historyText);
        String answer = chatWithRetry(followupPrompt).trim();

        messageMapper.insert(BabyBehaviorMessage.builder()
                .consultNo(consult.getConsultNo())
                .role("assistant")
                .content(truncate(answer, 1000))
                .build());

        return buildResponse(consult);
    }

    @Override
    public PageResponseDTO<BehaviorConsultResponse> getList(Long babyNo, String email, PageRequestDTO pageRequestDTO) {

        log.info("behavior_Service_getList_실행~~~~~~~~~~~~");

        int skip = (pageRequestDTO.getPage() - 1) * pageRequestDTO.getSize();

        List<BabyBehaviorConsult> result = consultMapper.selectListByBaby(babyNo, email, skip, pageRequestDTO.getSize());

        List<BehaviorConsultResponse> dtoList = result.stream()
                .map(consult -> BehaviorConsultResponse.builder()
                        .consultNo(consult.getConsultNo())
                        .category(consult.getCategory())
                        .situation(consult.getSituation())
                        .aiSummary(consult.getAiSummary())
                        .steps(List.of())
                        .sources(List.of())
                        .videoId(consult.getVideoId())
                        .videoTitle(consult.getVideoTitle())
                        .messages(List.of())
                        .regTime(consult.getRegTime())
                        .build())
                .collect(Collectors.toList());

        long totalCount = consultMapper.selectListCountByBaby(babyNo, email);

        return PageResponseDTO.<BehaviorConsultResponse>withAll()
                .dtoList(dtoList)
                .totalCount(totalCount)
                .pageRequestDTO(pageRequestDTO)
                .build();
    }

    @Override
    public BehaviorConsultResponse getDetail(Long consultNo, String email) {

        log.info("behavior_Service_getDetail_실행~~~~~~~~~~~~");

        BabyBehaviorConsult consult = consultMapper.selectByConsultNo(consultNo, email);
        if (consult == null) {
            throw new IllegalArgumentException("존재하지 않는 상담입니다: " + consultNo);
        }

        return buildResponse(consult);
    }

    @Override
    public void removeConsult(Long consultNo, String email) {

        log.info("behavior_Service_removeConsult_실행~~~~~~~~~~~~");

        BabyBehaviorConsult consult = consultMapper.selectByConsultNo(consultNo, email);
        if (consult == null) {
            throw new IllegalArgumentException("존재하지 않는 상담입니다: " + consultNo);
        }

        messageMapper.deleteByConsultNo(consultNo);
        sourceMapper.deleteByConsultNo(consultNo);
        stepMapper.deleteByConsultNo(consultNo);
        consultMapper.delete(consultNo, email);
    }

    private BehaviorConsultResponse buildResponse(BabyBehaviorConsult consult) {

        List<BehaviorStepDTO> steps = stepMapper.selectListByConsultNo(consult.getConsultNo()).stream()
                .map(s -> BehaviorStepDTO.builder()
                        .stepOrder(s.getStepOrder())
                        .title(s.getTitle())
                        .description(s.getDescription())
                        .build())
                .collect(Collectors.toList());

        List<BehaviorSourceDTO> sources = sourceMapper.selectListByConsultNo(consult.getConsultNo()).stream()
                .map(s -> BehaviorSourceDTO.builder()
                        .title(s.getTitle())
                        .link(s.getLink())
                        .press(s.getPress())
                        .pubDate(s.getPubDate())
                        .build())
                .collect(Collectors.toList());

        List<BehaviorMessageDTO> messages = messageMapper.selectListByConsultNo(consult.getConsultNo()).stream()
                .map(m -> BehaviorMessageDTO.builder()
                        .role(m.getRole())
                        .content(m.getContent())
                        .build())
                .collect(Collectors.toList());

        return BehaviorConsultResponse.builder()
                .consultNo(consult.getConsultNo())
                .category(consult.getCategory())
                .situation(consult.getSituation())
                .aiSummary(consult.getAiSummary())
                .steps(steps)
                .sources(sources)
                .videoId(consult.getVideoId())
                .videoTitle(consult.getVideoTitle())
                .messages(messages)
                .regTime(consult.getRegTime())
                .build();
    }

    private String stripHtml(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("<[^>]*>", "")
                .replace("&quot;", "\"")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    private String extractPress(String originalLink) {
        try {
            String host = URI.create(originalLink).getHost();
            return host == null ? null : host.replaceFirst("^www\\.", "");
        } catch (Exception e) {
            return null;
        }
    }

    private String chatWithRetry(String prompt) {
        try {
            return ollamaClient.chat(prompt);
        } catch (Exception e) {
            log.warn("Ollama 호출 실패, 1회 재시도: " + e.getMessage());
            try {
                return ollamaClient.chat(prompt);
            } catch (Exception retryFailed) {
                throw new IllegalArgumentException("AI가 질문을 인식하지 못했습니다. 다시 시도해주세요.", retryFailed);
            }
        }
    }

    private JsonObject chatJsonWithRetry(String prompt) {
        try {
            return JsonParser.parseString(extractJson(ollamaClient.chat(prompt))).getAsJsonObject();
        } catch (Exception e) {
            log.warn("AI 응답 파싱 실패, 1회 재시도: " + e.getMessage());
            try {
                return JsonParser.parseString(extractJson(ollamaClient.chat(prompt))).getAsJsonObject();
            } catch (Exception retryFailed) {
                throw new IllegalArgumentException("AI가 질문을 인식하지 못했습니다. 다시 시도해주세요.", retryFailed);
            }
        }
    }

    private String extractJson(String raw) {
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start == -1 || end == -1 || end < start) {
            throw new IllegalStateException("AI 응답에서 JSON을 찾을 수 없습니다: " + raw);
        }
        return raw.substring(start, end + 1);
    }

    private String truncate(String text, int maxLength) {
        if (text == null || text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength);
    }

}