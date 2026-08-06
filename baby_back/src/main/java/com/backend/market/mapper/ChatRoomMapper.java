package com.backend.market.mapper;

import com.backend.market.domain.ChatRoom;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatRoomMapper {

    // 이미 만들어진 방 있는지 확인 (같은 매물 + 같은 구매자/판매자 조합으로 중복 생성 방지)
    ChatRoom selectByItemAndMembers(@Param("itemNo") Long itemNo,
                                    @Param("buyerEmail") String buyerEmail,
                                    @Param("sellerEmail") String sellerEmail);

    // 채팅목록: 내가 buyer거나 seller인 방 전부
    List<ChatRoom> selectListByMember(@Param("memberEmail") String memberEmail);

    ChatRoom selectOne(@Param("roomNo") Long roomNo);

    void insert(ChatRoom chatRoom);

}
