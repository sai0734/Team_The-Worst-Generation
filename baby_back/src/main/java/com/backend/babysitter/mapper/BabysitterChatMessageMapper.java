package com.backend.babysitter.mapper;

import com.backend.babysitter.domain.BabysitterChatMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface BabysitterChatMessageMapper {

    List<BabysitterChatMessage> selectListByRoom(@Param("roomNo") Long roomNo);

    void insert(BabysitterChatMessage chatMessage);

}
