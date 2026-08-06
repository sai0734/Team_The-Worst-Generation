package com.backend.quest.service;

import com.backend.quest.dto.ChallengeDTO;

import java.util.List;

public interface ChallengeService {
    List<ChallengeDTO> myChallenges(String email);
    void start(String email, Long challengeId);
    void checkin(String email, Long memberChallengeId);
}
