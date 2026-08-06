package com.backend.quest.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.backend.quest.domain.MemberQuest;
import com.backend.quest.domain.Quest;
import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.UrgentQuestCreateDTO;
import com.backend.quest.mapper.QuestMapper;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class QuestServiceImpl implements QuestService {

    private final QuestMapper questMapper;

    @Override
    public QuestHomeDTO getHome(String email) {
        LocalDate today = LocalDate.now();

        // YSJ - 기한 만료 처리 + 오늘 일퀘 자동 배정
        questMapper.expireOverdue(email, today);
        ensureDailyQuests(email);

        List<MemberQuest> list = questMapper.selectTodayByMember(email, today);

        List<MemberQuestDTO> daily = list.stream()
                .filter(q -> "DAILY".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<MemberQuestDTO> weekly = list.stream()
                .filter(q -> "WEEKLY".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<MemberQuestDTO> event = list.stream()
                .filter(q -> "EVENT".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<MemberQuestDTO> urgent = list.stream()
                .filter(q -> "URGENT".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        return QuestHomeDTO.builder()
                .dailyQuests(daily)
                .weeklyQuests(weekly)
                .eventQuests(event)
                .urgentQuests(urgent)
                .point(0)
                .challenges(Collections.emptyList())
                .monthlyPopupDTO(null)
                .build();
    }

    @Override
    public MemberQuestDTO complete(String email, Long id) {
        MemberQuest mq = questMapper.selectMemberQuest(id, email);
        if (mq == null) {
            throw new IllegalArgumentException("퀘스트 없음");
        }
        if ("DONE".equals(mq.getStatus())) {
            return toDTO(mq);
        }

        questMapper.completeMemberQuest(id, email);
        return toDTO(questMapper.selectMemberQuest(id, email));
    }

    @Override
    public void ensureDailyQuests(String email) {
        LocalDate today = LocalDate.now();

        int exists = questMapper.countAssignedTodayByType(email, today, "DAILY");
        if (exists > 0) {
            return;
        }

        // YSJ - 활성 일퀘 중 랜덤 5개만 배정
        List<Quest> dailies = questMapper.selectRandomDaily(5);
        for (Quest q : dailies) {
            MemberQuest mq = MemberQuest.builder()
                    .memberEmail(email)
                    .questId(q.getQuestId())
                    .status("TODO")
                    .assignedDate(today)
                    .dueDate(today)
                    .createdBy(null)
                    .build();
            questMapper.insertMemberQuest(mq);
        }
    }

    @Override
    public MemberQuestDTO createUrgentBySpouse(String creatorEmail, UrgentQuestCreateDTO dto) {
        String partner = questMapper.selectPartnerEmail(creatorEmail);
        if (partner == null) {
            throw new IllegalStateException("연결된 배우자가 없습니다");
        }

        LocalDate today = LocalDate.now();

        Quest urgent = Quest.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type("URGENT")
                .difficulty("MEDIUM")
                .theme("REQUEST")
                .reward(dto.getReward())
                .urgency(dto.getUrgency())
                .dueDays(1)
                .active(true)
                .build();
        questMapper.insertUrgentQuest(urgent);

        MemberQuest mq = MemberQuest.builder()
                .memberEmail(partner)
                .questId(urgent.getQuestId())
                .status("TODO")
                .assignedDate(today)
                .dueDate(today)
                .createdBy(creatorEmail)
                .build();
        questMapper.insertMemberQuest(mq);

        return toDTO(questMapper.selectMemberQuest(mq.getId(), partner));
    }

    // YSJ - 주간퀘스트: 일주일에 1개만 수령 (월~일)
    @Override
    public MemberQuestDTO claimWeekly(String email, Long questId) {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);

        int count = questMapper.countAssignedBetweenByType(email, weekStart, weekEnd, "WEEKLY");
        if (count >= 1) {
            throw new IllegalStateException("주간 퀘스트는 일주일에 1개만 수령할 수 있습니다.");
        }

        Quest quest = questMapper.selectActiveQuest(questId, "WEEKLY");
        if (quest == null) {
            throw new IllegalArgumentException("주간 퀘스트가 없거나 비활성입니다.");
        }

        MemberQuest mq = MemberQuest.builder()
                .memberEmail(email)
                .questId(questId)
                .status("TODO")
                .assignedDate(today)
                .dueDate(today.plusDays(7))
                .createdBy(null)
                .build();

        questMapper.insertMemberQuest(mq);
        return toDTO(questMapper.selectMemberQuest(mq.getId(), email));
    }

    // YSJ - 이벤트퀘스트: 하루에 2개만 수령
    @Override
    public MemberQuestDTO claimEvent(String email, Long questId) {
        LocalDate today = LocalDate.now();

        int count = questMapper.countAssignedTodayByType(email, today, "EVENT");
        if (count >= 2) {
            throw new IllegalStateException("이벤트 퀘스트는 하루에 2개만 수령할 수 있습니다.");
        }

        Quest quest = questMapper.selectActiveQuest(questId, "EVENT");
        if (quest == null) {
            throw new IllegalArgumentException("이벤트 퀘스트가 없거나 비활성입니다.");
        }

        int dueDays = quest.getDueDays() > 0 ? quest.getDueDays() : 7;

        MemberQuest mq = MemberQuest.builder()
                .memberEmail(email)
                .questId(questId)
                .status("TODO")
                .assignedDate(today)
                .dueDate(today.plusDays(dueDays))
                .createdBy(null)
                .build();

        questMapper.insertMemberQuest(mq);
        return toDTO(questMapper.selectMemberQuest(mq.getId(), email));
    }

    private MemberQuestDTO toDTO(MemberQuest mq) {
        QuestDTO quest = QuestDTO.builder()
                .questId(mq.getQuestId())
                .title(mq.getTitle())
                .description(mq.getDescription())
                .type(mq.getType())
                .difficulty(mq.getDifficulty())
                .theme(mq.getTheme())
                .dueDays(mq.getDueDays())
                .reward(mq.getReward())
                .urgency(mq.getUrgency())
                .active(true)
                .build();

        return MemberQuestDTO.builder()
                .id(mq.getId())
                .memberEmail(mq.getMemberEmail())
                .questId(mq.getQuestId())
                .status(mq.getStatus())
                .assignedDate(mq.getAssignedDate())
                .dueDate(mq.getDueDate())
                .completedAt(mq.getCompletedAt())
                .quest(quest)
                .build();
    }
}
