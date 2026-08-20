package com.backend.quest.mapper;

import com.backend.quest.domain.MemberQuest;
import com.backend.quest.domain.Quest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.util.List;

@Mapper
// YSJ - MyBatis QuestMapper 인터페이스 복구
public interface QuestMapper {

    void ensureProfileIdColumn();

    List<MemberQuest> selectTodayByMember(
            @Param("email") String email,
            @Param("date") LocalDate date,
            @Param("profileId") Long profileId);

    MemberQuest selectMemberQuest(
            @Param("id") Long id,
            @Param("email") String email);

    void completeMemberQuest(
            @Param("id") Long id,
            @Param("email") String email);

    void uncompleteMemberQuest(
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


    //활성 일퀘 마스터
    List<Quest> selectActiveDailyQuests();

    //오늘 이미 배정되었는지
    int countTodayAssigned(
            @Param("email") String email,
            @Param("date") LocalDate date,
            @Param("type") String type);

    //    일퀘 배정 insert
    void insertMemberQuest(MemberQuest memberQuest);

    //배우자 이메일 조회
    String selectPartnerEmail(@Param("email") String email);

    //긴급퀘 마스터 생성
    void insertUrgentQuest(Quest quest);

    void expireOverdue(
            @Param("email") String email,
            @Param("today") LocalDate today,
            @Param("profileId") Long profileId);

    List<Quest> selectRandomDaily(@Param("limit") int limit);

    int countAssignedTodayByType(@Param("email") String email,
                                 @Param("date") LocalDate date,
                                 @Param("type") String type,
                                 @Param("profileId") Long profileId);

}
