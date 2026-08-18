package com.backend.babysitter.service;

import com.backend.babysitter.domain.BabysitterChatRoom;
import com.backend.babysitter.dto.BabysitterChatRoomDTO;
import com.backend.babysitter.mapper.BabysitterChatRoomMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class BabysitterChatRoomServiceImpl implements BabysitterChatRoomService {

    private final BabysitterChatRoomMapper babysitterChatRoomMapper;

    private final BabysitterProfileMapper babysitterProfileMapper;

    private final ModelMapper modelMapper;

    @Override
    public List<BabysitterChatRoomDTO> getListByMember(String memberEmail) {

        List<BabysitterChatRoom> result = babysitterChatRoomMapper.selectListByMember(memberEmail);

        return result.stream()
                .map(chatRoom -> modelMapper.map(chatRoom, BabysitterChatRoomDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public BabysitterChatRoomDTO getOrCreate(String parentEmail, String sitterEmail) {

        if (parentEmail.equals(sitterEmail)) {
            throw new IllegalArgumentException("자기 자신과는 채팅할 수 없습니다.");
        }

        if (babysitterProfileMapper.selectByEmail(sitterEmail) == null) {
            throw new NoSuchElementException("등록된 시터 프로필이 없습니다.");
        }

        BabysitterChatRoom existing = babysitterChatRoomMapper.selectByMembers(parentEmail, sitterEmail);

        if (existing != null) {
            return modelMapper.map(existing, BabysitterChatRoomDTO.class);
        }

        BabysitterChatRoom chatRoom = BabysitterChatRoom.builder()
                .parentEmail(parentEmail)
                .sitterEmail(sitterEmail)
                .build();

        babysitterChatRoomMapper.insert(chatRoom);

        return modelMapper.map(chatRoom, BabysitterChatRoomDTO.class);
    }
}
