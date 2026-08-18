package com.backend.babysitter.controller;

import com.backend.babysitter.dto.BabysitterChatMessageDTO;
import com.backend.babysitter.service.BabysitterChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Log4j2
public class BabysitterChatWebSocketController {

    private final BabysitterChatMessageService babysitterChatMessageService;

    // 프론트에서 /app/babysitter-chat/{roomNo}/send 로 보내면, 저장 후 /topic/babysitter-chat/{roomNo} 구독자 전체한테 뿌림
    @MessageMapping("/babysitter-chat/{roomNo}/send")
    @SendTo("/topic/babysitter-chat/{roomNo}")
    public BabysitterChatMessageDTO send(@DestinationVariable Long roomNo, BabysitterChatMessageDTO chatMessageDTO) {

        chatMessageDTO.setRoomNo(roomNo);

        return babysitterChatMessageService.sendMessage(chatMessageDTO);
    }
}
