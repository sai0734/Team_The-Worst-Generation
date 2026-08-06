package com.backend.market.service;

import com.backend.market.domain.ChatMessage;
import com.backend.market.dto.ChatMessageDTO;
import com.backend.market.mapper.ChatMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.backend.market.domain.ChatRoom;
import com.backend.market.mapper.ChatRoomMapper;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;

    private final ModelMapper modelMapper;

    private final ChatRoomMapper chatRoomMapper;

    @Override
    public List<ChatMessageDTO> getListByRoom(Long roomNo, String requesterEmail) {

        ChatRoom room = Optional.ofNullable(chatRoomMapper.selectOne(roomNo))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다: " + roomNo));

        if (!room.getBuyerEmail().equals(requesterEmail) && !room.getSellerEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("본인이 참여한 채팅방만 조회할 수 있습니다.");
        }

        List<ChatMessage> result = chatMessageMapper.selectListByRoom(roomNo);

        return result.stream()
                .map(chatMessage -> modelMapper.map(chatMessage, ChatMessageDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public ChatMessageDTO sendMessage(ChatMessageDTO dto) {

        ChatMessage chatMessage = modelMapper.map(dto, ChatMessage.class);

        chatMessageMapper.insert(chatMessage);

        return modelMapper.map(chatMessage, ChatMessageDTO.class);
    }

    @Override
    public void respondToOffer(Long msgNo, String offerStatus, String requesterEmail) {

        ChatMessage message = Optional.ofNullable(chatMessageMapper.selectOne(msgNo))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 메시지입니다: " + msgNo));

        ChatRoom room = Optional.ofNullable(chatRoomMapper.selectOne(message.getRoomNo()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다: " + message.getRoomNo()));

        if (!room.getSellerEmail().equals(requesterEmail)) {
            throw new AccessDeniedException("판매자만 가격 제안에 응답할 수 있습니다.");
        }

        chatMessageMapper.updateOfferStatus(msgNo, offerStatus);
    }
}
