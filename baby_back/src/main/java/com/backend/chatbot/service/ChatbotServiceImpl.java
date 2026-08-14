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
        String message = request.getMessage() == null ? "" : request.getMessage();
        String prompt = """
                당신은 아이봄 육아 상담 AI입니다.
                수면, 수유/이유식, 발달, 예방접종, 놀이, 훈육, 일상 돌봄 등 육아 전반에 답합니다.
                진단이나 처방은 하지 마세요.
                호흡곤란, 경련, 의식저하 등 위험 증상이면 병원/응급실 안내만 하세요.
                보호자 질문에 바로 답하고, 필요하면 아이 개월수만 가볍게 물어보세요.
                육아와 무관한 질문은 짧게 거절하고 육아로 유도하세요.

                응답은 반드시 순수한 JSON 객체 1개여야 합니다.
                마크다운 코드 펜스를 쓰지 마세요. 앞뒤 설명도 금지합니다.
                {"reply": "답변 문장", "summary": "", "ready": false}

                이전대화:
                %s
                보호자메시지:
                %s
                """.formatted(historyText, message);


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
