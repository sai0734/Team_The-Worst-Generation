package com.backend.chatbot.controller;

import com.backend.chatbot.dto.ChatbotRequest;
import com.backend.chatbot.dto.ChatbotResponse;
import com.backend.chatbot.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping
    public ChatbotResponse chat(@RequestBody ChatbotRequest request) {
        return chatbotService.chat(request);
    }
}
