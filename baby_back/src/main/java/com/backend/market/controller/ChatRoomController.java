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
import java.util.Map;

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

    // 1단계: 구매자가 거래완료 신청 (판매자는 이 엔드포인트를 호출할 방법이 없음, 프론트에서도 버튼 자체를 안 보여줌)
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{roomNo}/request-complete")
    public Map<String, String> requestComplete(@PathVariable Long roomNo, Principal principal) {

        chatRoomService.requestComplete(roomNo, principal.getName());

        return Map.of("result", "success");
    }

    // 2단계: 판매자가 최종 확정 (구매자가 먼저 신청한 방만 가능, 구매자는 이 엔드포인트를 호출할 방법이 없음)
    @PreAuthorize("hasAnyRole('ROLE_USER')")
    @PutMapping("/{roomNo}/complete")
    public Map<String, String> complete(@PathVariable Long roomNo, Principal principal) {

        chatRoomService.confirmComplete(roomNo, principal.getName());

        return Map.of("result", "success");
    }
}
