package com.backend.quest.mapper;

import com.backend.quest.domain.MemberQuest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
// YSJ - MyBatis QuestMapper 인터페이스 복구
public interface QuestMapper {

    List<MemberQuest> selectTodayByMember(
            @Param("email") String email,
            @Param("date") LocalDate date);

    MemberQuest selectMemberQuest(
            @Param("id") Long id,
            @Param("email") String email);

    void completeMemberQuest(
            @Param("id") Long id,
            @Param("email") String email);

    int countCompletedBetween(
            @Param("email") String email,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    int countTotalBetween(
            @Param("email") String email,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    int sumRewardBetween(
            @Param("email") String email,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    // 최근 N일 중 완료한 날짜 목록(스트릭 계산용)
    List<LocalDate> selectCompletedDates(
            @Param("email") String email,
            @Param("from") LocalDate from);
}
