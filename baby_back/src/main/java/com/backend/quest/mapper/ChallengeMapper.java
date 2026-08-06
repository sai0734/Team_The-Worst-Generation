package com.backend.quest.mapper;

import com.backend.quest.domain.Challenge;
import com.backend.quest.domain.MemberChallenge;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface ChallengeMapper {
    List<MemberChallenge> selectOngoingByMember(@Param("email") String email);
    Challenge selectById(@Param("id") Long id);
    void insertMemberChallenge(MemberChallenge mc);
    MemberChallenge selectMemberChallenge(@Param("id") Long id, @Param("email") String email);
    int insertCheckin(@Param("mcId") Long mcId, @Param("date") LocalDate date);
    void updateMemberChallenge(MemberChallenge mc);

}
