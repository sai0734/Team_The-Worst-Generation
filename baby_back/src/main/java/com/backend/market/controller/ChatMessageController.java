package com.backend.market.controller;

import com.backend.global.util.CustomFileUtil;
import com.backend.market.dto.ChatMessageDTO;
import com.backend.market.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/market/chat")
public class ChatMessageController {

    private final ChatMessageService chatMessageService;

    private final CustomFileUtil fileUtil;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/rooms/{roomNo}/messages")
    public List<ChatMessageDTO> getMessages(@PathVariable Long roomNo, Principal principal) {
        return chatMessageService.getListByRoom(roomNo, principal.getName());
    }

    // 채팅 이미지 첨부: 먼저 업로드해서 파일명 받고, 그 파일명을 웹소켓으로 IMAGE 메시지로 보냄
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/upload-image")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) {

        List<String> uploadFileNames = fileUtil.saveFiles(List.of(file));

        return Map.of("fileName", uploadFileNames.get(0));
    }

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/messages/{msgNo}/offer")
    public Map<String, String> respondToOffer(@PathVariable Long msgNo, @RequestParam String offerStatus, Principal principal) {

        chatMessageService.respondToOffer(msgNo, offerStatus, principal.getName());

        return Map.of("result", "success");
    }
}