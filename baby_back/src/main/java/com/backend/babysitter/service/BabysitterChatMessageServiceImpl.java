package com.backend.babysitter.service;

import com.backend.babysitter.domain.BabysitterChatMessage;
import com.backend.babysitter.domain.BabysitterChatRoom;
import com.backend.babysitter.dto.BabysitterChatMessageDTO;
import com.backend.babysitter.mapper.BabysitterChatMessageMapper;
import com.backend.babysitter.mapper.BabysitterChatRoomMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class BabysitterChatMessageServiceImpl implements BabysitterChatMessageService {

    private final BabysitterChatMessageMapper babysitterChatMessageMapper;

    private final BabysitterChatRoomMapper babysitterChatRoomMapper;

    private final BabysitterRequestService babysitterRequestService;

    private final ModelMapper modelMapper;

    @Override
    public List<BabysitterChatMessageDTO> getListByRoom(Long roomNo, String requesterEmail) {

        BabysitterChatRoom room = getRoomOrThrow(roomNo);
        checkParticipant(room, requesterEmail);

        List<BabysitterChatMessage> result = babysitterChatMessageMapper.selectListByRoom(roomNo);

        return result.stream()
                .map(chatMessage -> modelMapper.map(chatMessage, BabysitterChatMessageDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public BabysitterChatMessageDTO sendMessage(BabysitterChatMessageDTO dto) {

        BabysitterChatRoom room = getRoomOrThrow(dto.getRoomNo());
        checkParticipant(room, dto.getSenderEmail());

        BabysitterChatMessage chatMessage = modelMapper.map(dto, BabysitterChatMessage.class);

        babysitterChatMessageMapper.insert(chatMessage);

        return modelMapper.map(chatMessage, BabysitterChatMessageDTO.class);
    }

    @Override
    public void respondToRequestCard(Long msgNo, String action, String requesterEmail) {

        BabysitterChatMessage message = Optional.ofNullable(babysitterChatMessageMapper.selectOne(msgNo))
                .orElseThrow(() -> new NoSuchElementException("존재하지 않는 메시지입니다: " + msgNo));

        if (!"REQUEST".equals(message.getMsgType()) || message.getRequestNo() == null) {
            throw new IllegalArgumentException("요청 카드가 아닙니다.");
        }

        String newStatus;
        if ("accept".equals(action)) {
            babysitterRequestService.accept(message.getRequestNo(), requesterEmail);
            newStatus = "ACCEPTED";
        } else if ("reject".equals(action)) {
            babysitterRequestService.reject(message.getRequestNo(), requesterEmail);
            newStatus = "REJECTED";
        } else {
            throw new IllegalArgumentException("알 수 없는 action입니다: " + action);
        }

        babysitterChatMessageMapper.updateRequestStatus(msgNo, newStatus);
    }

    private BabysitterChatRoom getRoomOrThrow(Long roomNo) {
        return Optional.ofNullable(babysitterChatRoomMapper.selectOne(roomNo))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채팅방입니다: " + roomNo));
    }

    private void checkParticipant(BabysitterChatRoom room, String email) {
        if (!room.getParentEmail().equals(email) && !room.getSitterEmail().equals(email)) {
            throw new AccessDeniedException("본인이 참여한 채팅방만 이용할 수 있습니다.");
        }
    }
}
