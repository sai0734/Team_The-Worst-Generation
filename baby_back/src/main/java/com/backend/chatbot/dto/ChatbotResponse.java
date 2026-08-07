package com.backend.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor


public class ChatbotResponse {
    private String reply;       //챗봇이 화면에 보여줄 말
    private String summary;     // 의사에게 보여줄 최종 요약문
    private boolean ready;      // 요약이 완성되었는지  -> 프론트로 보내는 결과상자

}
