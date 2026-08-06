package com.backend.market.mapper;

import com.backend.market.domain.ChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ChatMessageMapper {

    List<ChatMessage> selectListByRoom(@Param("roomNo") Long roomNo);

    ChatMessage selectOne(@Param("msgNo") Long msgNo);

    void insert(ChatMessage chatMessage);

    void updateOfferStatus(@Param("msgNo") Long msgNo, @Param("offerStatus") String offerStatus);

}
