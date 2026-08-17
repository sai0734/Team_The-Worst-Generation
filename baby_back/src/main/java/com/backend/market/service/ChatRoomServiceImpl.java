package com.backend.market.service;

import com.backend.market.domain.ChatRoom;
import com.backend.market.dto.ChatRoomDTO;
import com.backend.market.mapper.ChatRoomMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ChatRoomMapper chatRoomMapper;

    private final MarketItemService marketItemService;

    private final ModelMapper modelMapper;

    @Override
    public List<ChatRoomDTO> getListByMember(String memberEmail) {

        List<ChatRoom> result = chatRoomMapper.selectListByMember(memberEmail);

        return result.stream()
                .map(chatRoom -> modelMapper.map(chatRoom, ChatRoomDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public ChatRoomDTO getOrCreate(Long itemNo, String buyerEmail, String sellerEmail) {

        ChatRoom existing = chatRoomMapper.selectByItemAndMembers(itemNo, buyerEmail, sellerEmail);

        if (existing != null) {
            return modelMapper.map(existing, ChatRoomDTO.class);
        }

        ChatRoom chatRoom = ChatRoom.builder()
                .itemNo(itemNo)
                .buyerEmail(buyerEmail)
                .sellerEmail(sellerEmail)
                .build();

        chatRoomMapper.insert(chatRoom);

        return modelMapper.map(chatRoom, ChatRoomDTO.class);
    }

    @Override
    public void completeByBuyer(Long roomNo, String requesterEmail) {

        ChatRoom room = Optional.ofNullable(chatRoomMapper.selectOne(roomNo))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다: " + roomNo));

        if (!room.getBuyerEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("구매자만 거래완료로 변경할 수 있습니다.");
        }

        marketItemService.markAsCompletedByBuyer(room.getItemNo());
    }
}
