package com.backend.babysitter.controller;

import com.backend.babysitter.dto.BabysitterChatMessageDTO;
import com.backend.babysitter.service.BabysitterChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

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
}
