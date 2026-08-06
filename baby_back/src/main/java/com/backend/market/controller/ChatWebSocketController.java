package com.backend.market.controller;

import com.backend.market.dto.ChatMessageDTO;
import com.backend.market.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Log4j2
public class ChatWebSocketController {

    private final ChatMessageService chatMessageService;

    // 프론트에서 /app/chat/{roomNo}/send 로 보내면, 저장 후 /topic/chat/{roomNo} 구독자 전체한테 뿌림
    @MessageMapping("/chat/{roomNo}/send")
    @SendTo("/topic/chat/{roomNo}")
    public ChatMessageDTO send(@DestinationVariable Long roomNo, ChatMessageDTO chatMessageDTO) {

        chatMessageDTO.setRoomNo(roomNo);

        return chatMessageService.sendMessage(chatMessageDTO);
    }
}
