package com.backend.quest.service;

import com.backend.quest.dto.MemberQuestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
public class QuestRealtimeNotifier {

    private final SimpMessagingTemplate messagingTemplate;

    // YSJ - DB 커밋 뒤에만 푸시. 상대가 먼저 조회해도 없는 퀘가 보이지 않게 함
    public void notifyUrgentAssigned(Long targetProfileId, MemberQuestDTO dto) {
        if (targetProfileId == null || dto == null) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(targetProfileId, dto);
                }
            });
            return;
        }
        send(targetProfileId, dto);
    }

    private void send(Long targetProfileId, MemberQuestDTO dto) {
        messagingTemplate.convertAndSend("/topic/quest/" + targetProfileId, dto);
    }
}
