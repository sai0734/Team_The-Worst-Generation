package com.backend.quest.service;

import com.backend.quest.dto.MemberQuestDTO;
import com.backend.quest.dto.QuestHomeDTO;

public interface QuestService {

    QuestHomeDTO getHome(String email);
    MemberQuestDTO complete(String email, Long id);
}
