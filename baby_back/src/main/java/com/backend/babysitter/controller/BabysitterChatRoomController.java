package com.backend.babysitter.controller;

import com.backend.babysitter.dto.BabysitterChatRoomDTO;
import com.backend.babysitter.service.BabysitterChatRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/babysitter/chat/rooms")
@PreAuthorize("hasAnyRole('ROLE_USER')")
public class BabysitterChatRoomController {

    private final BabysitterChatRoomService babysitterChatRoomService;

    @GetMapping("/")
    public List<BabysitterChatRoomDTO> getMyList(Principal principal) {
        return babysitterChatRoomService.getListByMember(principal.getName());
    }

    // 시터 상세에서 "채팅하기" 눌렀을 때: 나(부모)는 로그인한 사람, 시터는 path의 email
    @PostMapping("/{sitterEmail}")
    public BabysitterChatRoomDTO getOrCreate(@PathVariable String sitterEmail, Principal principal) {
        return babysitterChatRoomService.getOrCreate(principal.getName(), sitterEmail);
    }
}
