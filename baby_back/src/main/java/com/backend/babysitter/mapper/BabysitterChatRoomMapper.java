package com.backend.babysitter.mapper;

import com.backend.babysitter.domain.BabysitterChatRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabysitterChatRoomMapper {

    // 이미 만들어진 방 있는지 확인 (같은 부모-시터 조합으로 중복 생성 방지)
    BabysitterChatRoom selectByMembers(@Param("parentEmail") String parentEmail,
                                        @Param("sitterEmail") String sitterEmail);

    // 채팅목록: 내가 parent거나 sitter인 방 전부
    List<BabysitterChatRoom> selectListByMember(@Param("memberEmail") String memberEmail);

    BabysitterChatRoom selectOne(@Param("roomNo") Long roomNo);

    void insert(BabysitterChatRoom chatRoom);

    // 방 입장(메시지 목록 조회) 시 그 시점까지 읽은 걸로 표시
    void updateParentLastRead(@Param("roomNo") Long roomNo, @Param("lastMsgNo") Long lastMsgNo);

    void updateSitterLastRead(@Param("roomNo") Long roomNo, @Param("lastMsgNo") Long lastMsgNo);

}
