package com.backend.quest.service;

import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestHomeDTO;
import com.backend.quest.dto.UrgentQuestCreateDTO;

public interface QuestService {

    QuestHomeDTO getHome(String email, Long profileId, String parentType);

    MemberQuestDTO complete(String email, Long id);

    MemberQuestDTO uncomplete(String email, Long id);

    void ensureDailyQuests(String email, Long profileId, String parentType);

    MemberQuestDTO createUrgentForOtherProfile(
            String creatorEmail, Long creatorProfileId, UrgentQuestCreateDTO dto);

}
