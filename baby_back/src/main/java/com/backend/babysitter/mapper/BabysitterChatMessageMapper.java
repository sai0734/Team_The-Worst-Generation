package com.backend.babysitter.mapper;

import com.backend.babysitter.domain.BabysitterChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabysitterChatMessageMapper {

    List<BabysitterChatMessage> selectListByRoom(@Param("roomNo") Long roomNo);

    BabysitterChatMessage selectOne(@Param("msgNo") Long msgNo);

    void insert(BabysitterChatMessage chatMessage);

    void updateRequestStatus(@Param("msgNo") Long msgNo, @Param("requestStatus") String requestStatus);

}
