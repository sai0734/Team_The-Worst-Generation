package com.backend.quest.service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import com.backend.auth.profile.domain.MemberProfile;
import com.backend.auth.profile.mapper.MemberProfileMapper;
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
    private final MemberProfileMapper memberProfileMapper;
    private final QuestRealtimeNotifier questRealtimeNotifier;

    @Override
    public QuestHomeDTO getHome(String email, Long profileId) {
        LocalDate today = LocalDate.now();

        // YSJ - 기한 만료 처리 + 오늘 일퀘 자동 배정
        questMapper.expireOverdue(email, today, profileId);
        ensureDailyQuests(email, profileId);

        List<MemberQuest> list = questMapper.selectTodayByMember(email, today, profileId);

        List<MemberQuestDTO> daily = list.stream()
                .filter(q -> "DAILY".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<MemberQuestDTO> urgent = list.stream()
                .filter(q -> "URGENT".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        return QuestHomeDTO.builder()
                .dailyQuests(daily)
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
    public MemberQuestDTO uncomplete(String email, Long id) {
        MemberQuest mq = questMapper.selectMemberQuest(id, email);
        if (mq == null) {
            throw new IllegalArgumentException("퀘스트 없음");
        }
        if (!"DONE".equals(mq.getStatus())) {
            return toDTO(mq);
        }

        questMapper.uncompleteMemberQuest(id, email);
        return toDTO(questMapper.selectMemberQuest(id, email));
    }

    @Override
    public void ensureDailyQuests(String email, Long profileId) {
        LocalDate today = LocalDate.now();

        int exists = questMapper.countAssignedTodayByType(email, today, "DAILY", profileId);
        int need = 3 - exists;
        if (need <= 0) {
            return;
        }

        // YSJ - 활성 일퀘 중 랜덤 최대 3개 배정
        List<Quest> dailies = questMapper.selectRandomDaily(need);
        for (Quest q : dailies) {
            MemberQuest mq = MemberQuest.builder()
                    .memberEmail(email)
                    .questId(q.getQuestId())
                    .status("TODO")
                    .assignedDate(today)
                    .dueDate(today)
                    .createdBy(null)
                    .profileId(profileId)
                    .build();
            questMapper.insertMemberQuest(mq);
        }
    }

    @Override
    public MemberQuestDTO createUrgentForOtherProfile(
            String creatorEmail, Long creatorProfileId, UrgentQuestCreateDTO dto) {
        if (creatorProfileId == null) {
            throw new IllegalArgumentException("프로필을 선택한 뒤 긴급 퀘스트를 보낼 수 있습니다");
        }
        if (dto == null || dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목을 입력하세요");
        }

        Long targetProfileId = findOtherProfileId(creatorEmail, creatorProfileId);

        LocalDate today = LocalDate.now();

        Quest urgent = Quest.builder()
                .title(dto.getTitle().trim())
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
                .memberEmail(creatorEmail)
                .questId(urgent.getQuestId())
                .status("TODO")
                .assignedDate(today)
                .dueDate(today)
                .createdBy(creatorEmail)
                .profileId(targetProfileId)
                .build();
        questMapper.insertMemberQuest(mq);

        MemberQuestDTO result = toDTO(questMapper.selectMemberQuest(mq.getId(), creatorEmail));
        questRealtimeNotifier.notifyUrgentAssigned(targetProfileId, result);
        return result;
    }

    private Long findOtherProfileId(String memberEmail, Long creatorProfileId) {
        List<MemberProfile> profiles = memberProfileMapper.selectListByMemberEmail(memberEmail);
        return profiles.stream()
                .map(MemberProfile::getProfileId)
                .filter(id -> id != null && !id.equals(creatorProfileId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("상대 프로필이 없습니다"));
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
                .profileId(mq.getProfileId())
                .quest(quest)
                .build();
    }
}
