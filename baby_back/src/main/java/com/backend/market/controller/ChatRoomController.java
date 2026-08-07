package com.backend.market.controller;

import com.backend.market.dto.ChatRoomDTO;
import com.backend.market.service.ChatRoomService;
import com.backend.market.service.MarketItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Log4j2
@RequestMapping("/api/market/chat/rooms")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    private final MarketItemService marketItemService;

    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @GetMapping("/")
    public List<ChatRoomDTO> getMyList(Principal principal) {
        return chatRoomService.getListByMember(principal.getName());
    }

    // 매물 상세에서 "채팅으로 문의하기" 눌렀을 때: 판매자 이메일은 매물에서 조회, 구매자는 로그인한 나
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PostMapping("/{itemNo}")
    public ChatRoomDTO getOrCreate(@PathVariable Long itemNo, Principal principal) {

        String sellerEmail = marketItemService.get(itemNo).getSellerEmail();

        return chatRoomService.getOrCreate(itemNo, principal.getName(), sellerEmail);
    }
}
