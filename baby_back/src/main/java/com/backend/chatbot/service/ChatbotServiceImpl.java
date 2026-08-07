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
                너는 소아과 방문 전 증상을 알려주는 도우미야.
                진단/처방은 하지마. 위험 증상(호흡곤란, 경련, 의식저하 등)이면
                즉시 병원/응급 안내만 해.
                
                목표가 채워질 때까지 한번에 질문은 1개씩 한다:
                - 아이 개월수/나이
                - 주요 증상
                - 시작 시점
                - 열 여부/최고체온
                - 식사*수분*소변
                - 발진/기침/구토/설사 등
                - 이미 준 약
                
                정보가 충분하면 ready = true로 보고,
                의사에게 보여줄 '증상 요약'을 3~6줄로 작성해.
                부족하면 ready = false, summary는 빈 문자열.
                
                반드시 JSON만 출력:
                {"reply":"...","summary":"...","ready":false}
                
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
