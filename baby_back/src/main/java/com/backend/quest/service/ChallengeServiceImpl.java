package com.backend.quest.service;

import com.backend.quest.domain.Challenge;
import com.backend.quest.domain.MemberChallenge;
import com.backend.quest.dto.ChallengeDTO;
import com.backend.quest.mapper.ChallengeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class ChallengeServiceImpl implements ChallengeService {

    private final ChallengeMapper challengeMapper;
    private final PointService pointService;

    @Override
    public List<ChallengeDTO> myChallenges(String email) {
        return challengeMapper.selectOngoingByMember(email).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void start(String email, Long challengeId) {
        Challenge challenge = challengeMapper.selectById(challengeId);
        if (challenge == null || !challenge.isActive()) {
            throw new IllegalArgumentException("챌린지가 없거나 비활성입니다.");
        }

        boolean already = challengeMapper.selectOngoingByMember(email).stream()
                .anyMatch(mc -> challengeId.equals(mc.getChallengeId()));
        if (already) {
            throw new IllegalStateException("이미 진행 중인 챌린지입니다.");
        }

        LocalDate today = LocalDate.now();
        MemberChallenge mc = MemberChallenge.builder()
                .memberEmail(email)
                .challengeId(challengeId)
                .status("ONGOING")
                .currentStreak(0)
                .startDate(today)
                .endDate(today.plusDays(challenge.getTargetDays() - 1L))
                .lastCheckDate(null)
                .build();

        challengeMapper.insertMemberChallenge(mc);
    }

    @Override
    public void checkin(String email, Long memberChallengeId) {
        MemberChallenge mc = challengeMapper.selectMemberChallenge(memberChallengeId, email);
        if (mc == null) {
            throw new IllegalArgumentException("챌린지 진행 정보가 없습니다.");
        }
        if (!"ONGOING".equals(mc.getStatus())) {
            throw new IllegalStateException("진행 중인 챌린지만 체크인할 수 있습니다.");
        }

        Challenge challenge = challengeMapper.selectById(mc.getChallengeId());
        if (challenge == null) {
            throw new IllegalArgumentException("챌린지 마스터가 없습니다.");
        }

        LocalDate today = LocalDate.now();

        if (today.equals(mc.getLastCheckDate())) {
            throw new IllegalStateException("오늘은 이미 체크인했습니다.");
        }

        // 어제 미체크 → 실패 + 포인트 차감
        if (mc.getLastCheckDate() != null
                && mc.getLastCheckDate().isBefore(today.minusDays(1))) {
            mc.setStatus("FAILED");
            challengeMapper.updateMemberChallenge(mc);
            pointService.add(email, -challenge.getFailPoint(), "CHALLENGE_FAIL", mc.getId());
            throw new IllegalStateException("연속 출석이 끊겨 챌린지에 실패했습니다.");
        }

        challengeMapper.insertCheckin(mc.getId(), today);

        int streak = mc.getCurrentStreak() + 1;
        mc.setCurrentStreak(streak);
        mc.setLastCheckDate(today);

        if (streak >= challenge.getTargetDays()) {
            mc.setStatus("SUCCESS");
            challengeMapper.updateMemberChallenge(mc);
            pointService.add(email, challenge.getSuccessPoint(), "CHALLENGE_SUCCESS", mc.getId());
            return;
        }

        challengeMapper.updateMemberChallenge(mc);
    }

    private ChallengeDTO toDTO(MemberChallenge mc) {
        return ChallengeDTO.builder()
                .id(mc.getId())
                .challengeId(mc.getChallengeId())
                .title(mc.getTitle())
                .status(mc.getStatus())
                .currentStreak(mc.getCurrentStreak())
                .targetDays(mc.getTargetDays())
                .lastCheckDate(mc.getLastCheckDate())
                .build();
    }
}