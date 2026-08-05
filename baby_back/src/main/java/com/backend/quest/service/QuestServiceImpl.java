package com.backend.quest.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.backend.quest.domain.MemberQuest;
import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.QuestStatsDTO;
import com.backend.quest.dto.QuestStreakDTO;
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
        List<MemberQuest> list = questMapper.selectTodayByMember(email, today);

        List<MemberQuestDTO> daily = list.stream()
                .filter(q -> "DAILY".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<MemberQuestDTO> urgent = list.stream()
                .filter(q -> "URGENT".equals(q.getType()))
                .map(this::toDTO)
                .collect(Collectors.toList());

        LocalDate weekStart = today.with(DayOfWeek.MONDAY);

        int dailyDone = questMapper.countCompletedBetween(email, today, today);
        int dailyTotal = questMapper.countTotalBetween(email, today, today);
        int weeklyDone = questMapper.countCompletedBetween(email, weekStart, today);
        int weeklyTotal = questMapper.countTotalBetween(email, weekStart, today);

        QuestStatsDTO stats = QuestStatsDTO.builder()
                .dailyCompleted(dailyDone)
                .dailyTotal(dailyTotal)
                .dailyRate(rate(dailyDone, dailyTotal))
                .weeklyCompleted(weeklyDone)
                .weeklyTotal(weeklyTotal)
                .weeklyRate(rate(weeklyDone, weeklyTotal))
                .pointsEarnedToday(questMapper.sumRewardBetween(email, today, today))
                .pointsEarnedWeek(questMapper.sumRewardBetween(email, weekStart, today))
                .build();

        return QuestHomeDTO.builder()
                .dailyQuests(daily)
                .urgentQuests(urgent)
                .streak(calcStreak(email, today))
                .stats(stats)
                .build();
    }

    @Override
    public MemberQuestDTO complete(String email, Long id) {
        MemberQuest mq = questMapper.selectMemberQuest(id, email);
        if (mq == null) throw new IllegalArgumentException("퀘스트 없음");
        if ("DONE".equals(mq.getStatus())) return toDTO(mq);

        questMapper.completeMemberQuest(id, email);
        return toDTO(questMapper.selectMemberQuest(id, email));
    }

    private QuestStreakDTO calcStreak(String email, LocalDate today) {
        List<LocalDate> dates = questMapper.selectCompletedDates(email, today.minusDays(60));
        int current = 0;
        LocalDate cursor = today;
        // 오늘 완료 없으면 어제부터
        if (!dates.contains(today)) cursor = today.minusDays(1);

        while (dates.contains(cursor)) {
            current++;
            cursor = cursor.minusDays(1);
        }

        int best = 0, run = 0;
        LocalDate prev = null;
        List<LocalDate> asc = new ArrayList<>(dates);
        asc.sort(LocalDate::compareTo);
        for (LocalDate d : asc) {
            if (prev != null && d.equals(prev.plusDays(1))) run++;
            else run = 1;
            best = Math.max(best, run);
            prev = d;
        }

        return QuestStreakDTO.builder()
                .currentStreak(current)
                .bestStreak(best)
                .build();
    }

    private double rate(int done, int total) {
        return total == 0 ? 0 : Math.round(done * 1000.0 / total) / 10.0;
    }

    private MemberQuestDTO toDTO(MemberQuest mq) {
        QuestDTO quest = QuestDTO.builder()
                .questId(mq.getQuestId())
                .title(mq.getTitle())
                .description(mq.getDescription())
                .type(mq.getType())
                .repeatType(mq.getRepeatType())
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
                .completedAt(mq.getCompletedAt())
                .quest(quest)
                .build();
    }
}