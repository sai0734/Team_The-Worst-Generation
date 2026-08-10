package com.backend.chatbot.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatbotRequest {
    private String message;     //보호자가 입력
    private List<String> history;       // 이전에 입력했던 말
}
