package com.backend.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.auth.domain.Member;
import com.backend.auth.mapper.MemberMapper;
import com.backend.babysitter.domain.BabysitterChatMessage;
import com.backend.babysitter.domain.BabysitterChatRoom;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.mapper.BabysitterChatMessageMapper;
import com.backend.babysitter.mapper.BabysitterChatRoomMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class BabysitterChatMessageMapperTests {

    private static final String PARENT_EMAIL = "chattest-parent@aaa.com";
    private static final String SITTER_EMAIL = "chattest-sitter@aaa.com";

    @Autowired
    private BabysitterChatMessageMapper babysitterChatMessageMapper;

    @Autowired
    private BabysitterChatRoomMapper babysitterChatRoomMapper;

    @Autowired
    private BabysitterProfileMapper babysitterProfileMapper;

    @Autowired
    private MemberMapper memberMapper;

    private Long roomNo;

    // 부모/시터 계정 + 시터 프로필 + 둘 사이 채팅방이 없으면 만들어둠 (FK 때문에 미리 있어야 함)
    @BeforeEach
    public void setUpFixtures() {

        if (memberMapper.selectByEmail(PARENT_EMAIL) == null) {
            memberMapper.insert(Member.builder()
                .email(PARENT_EMAIL)
                .pw("1111")
                .nickname("채팅테스트부모")
                .build());
            memberMapper.insertRole(PARENT_EMAIL, "USER");
        }

        if (memberMapper.selectByEmail(SITTER_EMAIL) == null) {
            memberMapper.insert(Member.builder()
                .email(SITTER_EMAIL)
                .pw("1111")
                .nickname("채팅테스트시터")
                .build());
            memberMapper.insertRole(SITTER_EMAIL, "USER");
        }

        if (babysitterProfileMapper.selectByEmail(SITTER_EMAIL) == null) {
            babysitterProfileMapper.insert(BabysitterProfile.builder()
                .email(SITTER_EMAIL)
                .name("채팅테스트시터")
                .careerYears(1)
                .build());
        }

        BabysitterChatRoom room = babysitterChatRoomMapper.selectByMembers(PARENT_EMAIL, SITTER_EMAIL);

        if (room == null) {
            room = BabysitterChatRoom.builder()
                .parentEmail(PARENT_EMAIL)
                .sitterEmail(SITTER_EMAIL)
                .build();
            babysitterChatRoomMapper.insert(room);
        }

        roomNo = room.getRoomNo();
    }

    @Test
    public void insert_selectListByRoom() {

        int before = babysitterChatMessageMapper.selectListByRoom(roomNo).size();

        BabysitterChatMessage first = BabysitterChatMessage.builder()
            .roomNo(roomNo)
            .senderEmail(PARENT_EMAIL)
            .content("안녕하세요, 상담 가능할까요?")
            .build();
        babysitterChatMessageMapper.insert(first);

        BabysitterChatMessage second = BabysitterChatMessage.builder()
            .roomNo(roomNo)
            .senderEmail(SITTER_EMAIL)
            .content("네, 가능합니다!")
            .build();
        babysitterChatMessageMapper.insert(second);

        assertNotNull(first.getMsgNo());
        assertNotNull(second.getMsgNo());

        List<BabysitterChatMessage> messages = babysitterChatMessageMapper.selectListByRoom(roomNo);

        assertEquals(before + 2, messages.size());

        // reg_time ASC 정렬이라 방금 넣은 두 개는 리스트 끝쪽에, 보낸 순서 그대로 있어야 함
        BabysitterChatMessage last = messages.get(messages.size() - 1);
        BabysitterChatMessage secondLast = messages.get(messages.size() - 2);

        assertEquals(SITTER_EMAIL, last.getSenderEmail());
        assertEquals("네, 가능합니다!", last.getContent());
        assertEquals(PARENT_EMAIL, secondLast.getSenderEmail());
        assertEquals("안녕하세요, 상담 가능할까요?", secondLast.getContent());

        boolean containsBoth = messages.stream().anyMatch(m -> m.getMsgNo().equals(first.getMsgNo()))
            && messages.stream().anyMatch(m -> m.getMsgNo().equals(second.getMsgNo()));

        assertTrue(containsBoth);

        log.info(messages);
    }
}
