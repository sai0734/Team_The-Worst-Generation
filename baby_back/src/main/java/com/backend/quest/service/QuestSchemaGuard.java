package com.backend.quest.service;

import com.backend.quest.mapper.QuestMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Log4j2
public class QuestSchemaGuard {

    private final QuestMapper questMapper;

    // YSJ - schema.sql은 공용이라 여기만 ALTER. 프로필별 긴급퀘 저장용
    @PostConstruct
    public void ensureProfileColumn() {
        questMapper.ensureProfileIdColumn();
        log.info("tbl_member_quest.profile_id ready");
    }
}
