package com.backend.quest.service;

import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.UrgentQuestCreateDTO;

public interface QuestService {

    QuestHomeDTO getHome(String email);

    MemberQuestDTO complete(String email, Long id);

    void ensureDailyQuests(String email);

    MemberQuestDTO createUrgentBySpouse(String creatorEmail, UrgentQuestCreateDTO dto);

    MemberQuestDTO claimWeekly(String email, Long questId);
    MemberQuestDTO claimEvent(String email, Long questId);

}