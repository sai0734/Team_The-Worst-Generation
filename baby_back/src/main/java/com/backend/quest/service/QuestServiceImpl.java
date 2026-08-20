package com.backend.quest.service;

import com.backend.auth.profile.domain.MemberProfile;
import com.backend.auth.profile.mapper.MemberProfileMapper;
import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import com.backend.global.ai.OpenClawClient;
import com.backend.quest.domain.MemberQuest;
import com.backend.quest.domain.Quest;
import com.backend.quest.dto.*;
import com.backend.quest.mapper.QuestMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Log4j2
@Service
@Transactional
@RequiredArgsConstructor
public class QuestServiceImpl implements QuestService {

    private final QuestMapper questMapper;
    private final MemberProfileMapper memberProfileMapper;
    private final QuestRealtimeNotifier questRealtimeNotifier;
    private final BabyInfoMapper babyInfoMapper;
    private final OpenClawClient openClawClient;
    private final PlatformTransactionManager platformTransactionManager;

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public QuestHomeDTO getHome(String email, Long profileId, String parentType) {
        LocalDate today = LocalDate.now();

        runInNewTransaction(() -> questMapper.expireOverdue(email, today, profileId));
        try {
            runInNewTransaction(() -> ensureDailyQuests(email, profileId, parentType));
        } catch (Exception e) {
            log.warn("일일퀘 자동생성 실패 profileId={}: {}", profileId, e.getMessage());
            try {
                runInNewTransaction(() -> assignFallbackOnly(email, profileId, today));
            } catch (Exception e2) {
                log.warn("일일퀘 fallback 실패 profileId={}: {}", profileId, e2.getMessage());
            }
        }

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
            throw new IllegalArgumentException("퀘스트없음");
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
            throw new IllegalArgumentException("퀘스트없음");
        }
        if (!"DONE".equals(mq.getStatus())) {
            return toDTO(mq);
        }
        questMapper.uncompleteMemberQuest(id, email);
        return toDTO(questMapper.selectMemberQuest(id, email));
    }

    @Override
    public void ensureDailyQuests(String email, Long profileId, String parentType) {
        LocalDate today = LocalDate.now();
        BabyInfo baby = findYoungestBaby(email);

        if (baby != null) {
            int seedCount = questMapper.countTodayDailyByCreatedBy(email, today, profileId, null);
            int aiCount = questMapper.countTodayDailyByCreatedBy(email, today, profileId, "AI");
            if (seedCount > 0 || aiCount == 0) {
                questMapper.deleteTodayDaily(email, today, profileId);
                assignBabyDailyQuests(email, profileId, parentType, baby, today);
            }
            return;
        }

        int exists = questMapper.countAssignedTodayByType(email, today, "DAILY", profileId);
        int need = 3 - exists;
        if (need <= 0) {
            return;
        }

        List<Quest> dailies = questMapper.selectRandomDailyExceptOtherProfile(
                email, today, profileId, need);
        int added = 0;
        if (dailies != null) {
            for (Quest q : dailies) {
                insertDaily(email, profileId, today, q.getQuestId(), null);
                added++;
            }
        }
        if (added < need) {
            assignFallbackOnly(email, profileId, today, need - added);
        }
    }

    private void runInNewTransaction(Runnable action) {
        TransactionTemplate tx = new TransactionTemplate(platformTransactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        tx.executeWithoutResult(status -> action.run());
    }

    private void assignFallbackOnly(String email, Long profileId, LocalDate today) {
        int exists = questMapper.countAssignedTodayByType(email, today, "DAILY", profileId);
        int need = 3 - exists;
        if (need <= 0) {
            return;
        }
        assignFallbackOnly(email, profileId, today, need);
    }

    private void assignFallbackOnly(String email, Long profileId, LocalDate today, int need) {
        List<DailyQuestDraft> drafts = fallbackDailyQuests(0, profileId, today);
        int remain = Math.min(need, drafts.size());
        for (int i = 0; i < remain; i++) {
            DailyQuestDraft draft = drafts.get(i);
            Quest daily = Quest.builder()
                    .title(draft.getTitle())
                    .description(draft.getDescription())
                    .type("DAILY")
                    .difficulty("MEDIUM")
                    .theme(draft.getTheme())
                    .reward(10)
                    .urgency(1)
                    .dueDays(1)
                    .active(true)
                    .build();
            questMapper.insertUrgentQuest(daily);
            insertDaily(email, profileId, today, daily.getQuestId(), null);
        }
    }

    private void insertDaily(
            String email, Long profileId, LocalDate today, Long questId, String createdBy) {
        questMapper.insertMemberQuest(MemberQuest.builder()
                .memberEmail(email)
                .questId(questId)
                .status("TODO")
                .assignedDate(today)
                .dueDate(today)
                .createdBy(createdBy)
                .profileId(profileId)
                .build());
    }

    private void assignBabyDailyQuests(
            String email, Long profileId, String parentType, BabyInfo baby, LocalDate today) {
        int months = ageInMonths(baby.getBirthDate(), today);
        String weekday = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.KOREAN);
        List<DailyQuestDraft> drafts = openClawClient.generateDailyQuests(
                months, parentLabel(parentType), weekday);
        if (drafts == null || drafts.size() != 3) {
            drafts = fallbackDailyQuests(months, profileId, today);
        }
        for (DailyQuestDraft draft : drafts) {
            Quest daily = Quest.builder()
                    .title(draft.getTitle())
                    .description(draft.getDescription())
                    .type("DAILY")
                    .difficulty("MEDIUM")
                    .theme(draft.getTheme())
                    .reward(10)
                    .urgency(1)
                    .dueDays(1)
                    .active(true)
                    .build();
            questMapper.insertUrgentQuest(daily);
            insertDaily(email, profileId, today, daily.getQuestId(), "AI");
        }
    }

    private BabyInfo findYoungestBaby(String email) {
        List<BabyInfo> babies = babyInfoMapper.selectList(email);
        if (babies == null || babies.isEmpty()) {
            return null;
        }
        return babies.stream()
                .max(Comparator.comparing((BabyInfo b) ->
                        b.getBirthDate() == null ? LocalDate.MIN : b.getBirthDate()))
                .orElse(babies.get(0));
    }

    private static int ageInMonths(LocalDate birth, LocalDate today) {
        if (birth == null) {
            return 0;
        }
        int months = (today.getYear() - birth.getYear()) * 12
                + (today.getMonthValue() - birth.getMonthValue());
        if (today.getDayOfMonth() < birth.getDayOfMonth()) {
            months--;
        }
        return Math.max(months, 0);
    }

    private static String parentLabel(String parentType) {
        if ("FATHER".equalsIgnoreCase(parentType)) {
            return "아빠";
        }
        if ("MOTHER".equalsIgnoreCase(parentType)) {
            return "엄마";
        }
        return "미입력";
    }

    private List<DailyQuestDraft> fallbackDailyQuests(int months, Long profileId, LocalDate today) {
        int rot = Math.floorMod(today.getDayOfYear() + (profileId == null ? 0 : profileId.intValue()), 3);
        String[] care;
        String[] activity;
        String[] chore;
        if (months < 4) {
            care = new String[]{"수유 후 트림 시키기", "기저귀 상태 확인하기", "낮잠 재우기"};
            activity = new String[]{"터미타임 하기", "눈맞춤하며 말하기", "부드러운 마사지"};
            chore = new String[]{"젖병 소독하기", "속싸개 준비하기", "아이 빨래 널기"};
        } else if (months < 7) {
            care = new String[]{"이유식 한 끼 챙기기", "낮잠 루틴 지키기", "기저귀 교대하기"};
            activity = new String[]{"바닥에 앉아 놀이하기", "짧은 산책하기", "딸랑이 놀이"};
            chore = new String[]{"젖병·식기 설거지", "외출 가방 챙기기", "장난감 닦기"};
        } else if (months < 13) {
            care = new String[]{"이유식/간식 챙기기", "낮잠 재우기", "손 씻기기"};
            activity = new String[]{"잡고 서기 놀이", "그림책 읽어주기", "실내 기어다니기 놀이"};
            chore = new String[]{"밥상 정리하기", "빨대컵 세척하기", "놀이매트 정리"};
        } else {
            care = new String[]{"식사 한 끼 담당하기", "양치 도와주기", "잠자리 루틴"};
            activity = new String[]{"바깥 산책하기", "블록 놀이하기", "함께 책 읽기"};
            chore = new String[]{"아이 옷 개기", "장난감 제자리 두기", "내일 옷 골라두기"};
        }
        return List.of(
                DailyQuestDraft.builder().title(care[rot]).theme("CARE").description("").build(),
                DailyQuestDraft.builder().title(activity[rot]).theme("ACTIVITY").description("").build(),
                DailyQuestDraft.builder().title(chore[rot]).theme("CHORE").description("").build()
        );
    }

    @Override
    public MemberQuestDTO createUrgentForOtherProfile(
            String creatorEmail, Long creatorProfileId, UrgentQuestCreateDTO dto) {
        if (creatorProfileId == null) {
            throw new IllegalArgumentException("프로필을 선택한 뒤 긴급퀘스트를 보낼수 있습니다.");
        }
        if (dto == null || dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("내용을 입력하세요");
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
                .orElseThrow(() -> new IllegalArgumentException("상대프로필이 없습니다."));
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
