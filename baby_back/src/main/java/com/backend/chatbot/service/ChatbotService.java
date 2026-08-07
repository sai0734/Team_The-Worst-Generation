package com.backend.chatbot.service;

import com.backend.chatbot.dto.ChatbotRequest;
import com.backend.chatbot.dto.ChatbotResponse;

public interface ChatbotService {
    ChatbotResponse chat(ChatbotRequest request);
}
