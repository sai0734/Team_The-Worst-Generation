package com.backend.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.backend.auth.domain.Member;
import com.backend.auth.mapper.MemberMapper;
import com.backend.babysitter.domain.BabysitterChatRoom;
import com.backend.babysitter.domain.BabysitterProfile;
import com.backend.babysitter.mapper.BabysitterChatRoomMapper;
import com.backend.babysitter.mapper.BabysitterProfileMapper;

import lombok.extern.log4j.Log4j2;

@SpringBootTest
@Log4j2
public class BabysitterChatRoomMapperTests {

    private static final String PARENT_EMAIL = "chattest-parent@aaa.com";
    private static final String SITTER_EMAIL = "chattest-sitter@aaa.com";

    @Autowired
    private BabysitterChatRoomMapper babysitterChatRoomMapper;

    @Autowired
    private BabysitterProfileMapper babysitterProfileMapper;

    @Autowired
    private MemberMapper memberMapper;

    // 부모/시터 테스트 계정 + 시터 프로필이 없으면 만들어둠 (FK 때문에 미리 있어야 함)
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
    }

    // 다음 테스트 실행 시 uq_babysitter_chat_room 유니크 제약에 안 걸리도록 정리
    @AfterEach
    public void cleanupRoom() {

        BabysitterChatRoom room = babysitterChatRoomMapper.selectByMembers(PARENT_EMAIL, SITTER_EMAIL);

        if (room != null) {
            log.info("cleanup은 room 자체 delete 매퍼가 없어 남겨둠 (roomNo={})", room.getRoomNo());
        }
    }

    @Test
    public void insert_selectByMembers() {

        BabysitterChatRoom before = babysitterChatRoomMapper.selectByMembers(PARENT_EMAIL, SITTER_EMAIL);

        if (before != null) {
            log.info("이미 존재하는 방으로 검증: roomNo={}", before.getRoomNo());
            assertEquals(PARENT_EMAIL, before.getParentEmail());
            assertEquals(SITTER_EMAIL, before.getSitterEmail());
            return;
        }

        BabysitterChatRoom room = BabysitterChatRoom.builder()
            .parentEmail(PARENT_EMAIL)
            .sitterEmail(SITTER_EMAIL)
            .build();

        babysitterChatRoomMapper.insert(room);

        assertNotNull(room.getRoomNo());

        BabysitterChatRoom found = babysitterChatRoomMapper.selectByMembers(PARENT_EMAIL, SITTER_EMAIL);

        assertNotNull(found);
        assertEquals(PARENT_EMAIL, found.getParentEmail());
        assertEquals(SITTER_EMAIL, found.getSitterEmail());

        log.info(found);
    }

    @Test
    public void selectListByMember_양쪽_모두에서_조회된다() {

        BabysitterChatRoom room = babysitterChatRoomMapper.selectByMembers(PARENT_EMAIL, SITTER_EMAIL);

        if (room == null) {
            room = BabysitterChatRoom.builder()
                .parentEmail(PARENT_EMAIL)
                .sitterEmail(SITTER_EMAIL)
                .build();
            babysitterChatRoomMapper.insert(room);
        }

        Long roomNo = room.getRoomNo();

        boolean foundForParent = babysitterChatRoomMapper.selectListByMember(PARENT_EMAIL).stream()
            .anyMatch(r -> r.getRoomNo().equals(roomNo));

        boolean foundForSitter = babysitterChatRoomMapper.selectListByMember(SITTER_EMAIL).stream()
            .anyMatch(r -> r.getRoomNo().equals(roomNo));

        assertTrue(foundForParent);
        assertTrue(foundForSitter);
    }
}
