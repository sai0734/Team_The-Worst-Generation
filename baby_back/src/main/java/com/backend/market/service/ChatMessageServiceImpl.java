package com.backend.market.service;

import com.backend.market.domain.ChatMessage;
import com.backend.market.dto.ChatMessageDTO;
import com.backend.market.mapper.ChatMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<ChatMessageDTO> getListByRoom(Long roomNo) {

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
    public void respondToOffer(Long msgNo, String offerStatus) {
        chatMessageMapper.updateOfferStatus(msgNo, offerStatus);
    }
}
