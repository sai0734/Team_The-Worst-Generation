package com.backend.chatbot.service;

import com.backend.chatbot.dto.ChatbotRequest;
import com.backend.chatbot.dto.ChatbotResponse;
import com.backend.global.ai.OllamaClient;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor


public class ChatbotServiceImpl implements ChatbotService{

    /* summary는 의사에게 보여줄 최종 요약문*/
    /* raw는 AI가 보낸 문자열*/

    private final OllamaClient ollamaClient;

    @Override
    public ChatbotResponse chat(ChatbotRequest request) {


        String historyText = request.getHistory() == null
                ? ""
           : String .join("\n", request.getHistory());
   String prompt = """
                # 역할 및 페르소나
               당신은 소아과 방문 전 증상을 수집하는 AI 도우미입니다.
               - 절대 진단이나 처방을 하지 마세요.
               - 호흡곤란, 경련, 의식저하 등 위험 증상이 보이면 즉시 "응급실이나 병원으로 가셔야 합니다"라는 안내만 수행하세요.
           
               # 질문 규칙 (반드시 준수)
               - 한 번에 딱 '1개'의 질문만 던져야 합니다. 여러 개를 동시에 묻지 마세요.
               - 다음 7가지 항목 중 보호자가 아직 말하지 않은 가장 첫 번째 항목을 찾아서 질문하세요.
                 1) 아이 개월수/나이 -> 2) 주요 증상 -> 3) 시작 시점 -> 4) 열 여부/최고체온 -> 5) 식사/수분/소변 -> 6) 발진/기침/구토/설사 -> 7) 이미 준 약
           
               # 출력 규칙 (치명적)
               - 응답은 반드시 순수한 JSON 객체 1개여야 합니다.
               - 마크다운 코드 펜스(```json ```)를 절대 사용하지 마세요. 앞뒤 설명도 절대 금지합니다.
               - 정보가 부족하여 질문을 이어가야 하면: {"reply": "질문 문장 1개", "summary": "", "ready": false}
               - 7가지 정보가 모두 채워져 충분하다면: {"reply": "정보가 모두 수집되었습니다. 소아과 진료 시 아래 요약을 의사에게 보여주세요.", "summary": "수집된 정보를 바탕으로 의사 전달용 요약을 1문장으로 간결하게 작성", "ready": true}
           
               # 데이터 입력 방식
               이전대화:
               %s
               보호자메시지:
               %s
           
              """.formatted(historyText, request.getMessage());


        String raw = ollamaClient.chat(prompt).trim();
        return parse(raw);
    }

    private ChatbotResponse parse(String raw) {
        try {
            int start = raw.indexOf('{');
            int end = raw.lastIndexOf('}');
            String json = (start >= 0 && end > start) ? raw.substring(start, end + 1) : raw;

            JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
            return ChatbotResponse.builder()
                    .reply(obj.has("reply") ? obj.get("reply").getAsString() : raw)
                    .summary(obj.has("summary") ? obj.get("summary").getAsString() : "")
                    .ready(obj.has("ready") && obj.get("ready").getAsBoolean())
                    .build();
        } catch (Exception e){
            return ChatbotResponse.builder()
                    .reply(raw)
                    .summary("")
                    .ready(false)
                    .build();
        }
    }
}
