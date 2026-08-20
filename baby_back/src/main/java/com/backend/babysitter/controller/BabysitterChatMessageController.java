package com.backend.babysitter.controller;

import com.backend.babysitter.dto.BabysitterChatMessageDTO;
import com.backend.babysitter.service.BabysitterChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/chat")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterChatMessageController {

    private final BabysitterChatMessageService babysitterChatMessageService;

    @GetMapping("/rooms/{roomNo}/messages")
    public List<BabysitterChatMessageDTO> getMessages(@PathVariable Long roomNo, Principal principal) {
        return babysitterChatMessageService.getListByRoom(roomNo, principal.getName());
    }

    // 채팅 안 요청 카드 수락/거절. action: "accept" | "reject"
    @PutMapping("/messages/{msgNo}/respond")
    public Map<String, String> respond(
            @PathVariable Long msgNo,
            @RequestParam String action,
            Principal principal) {

        babysitterChatMessageService.respondToRequestCard(msgNo, action, principal.getName());

        return Map.of("result", "success");
    }
}
