package com.backend.recall.service;

import com.backend.openclaw.common.dto.MissionSource;
import com.backend.openclaw.message.dto.MessageRequestDTO;
import com.backend.openclaw.message.service.MessageMissionDispatchService;
import com.backend.openclaw.message.service.MessageMissionService;
import com.backend.recall.domain.MyProduct;
import com.backend.recall.domain.RecallSetting;
import com.backend.recall.mapper.RecallSettingMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Log4j2
public class RecallNoticeServiceImpl implements RecallNoticeService {

    private final RecallSettingMapper recallSettingMapper;
    private final MessageMissionService messageMissionService;
    private final MessageMissionDispatchService messageMissionDispatchService;

    @Override
    public void notifyAfterCommit(MyProduct product) {
        Runnable dispatch = () -> notifyOwner(product);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            CompletableFuture.runAsync(dispatch);
                        }
                    }
            );
            return;
        }

        dispatch.run();
    }

    private void notifyOwner(MyProduct product) {
        try {
            RecallSetting setting = recallSettingMapper.selectByEmail(product.getMemberEmail());

            if (setting == null || setting.getNotificationPhone() == null || setting.getNotificationPhone().isBlank()) {
                log.info(
                        "리콜 알림 스킵 (등록된 번호 없음): productNo={}, memberEmail={}",
                        product.getProductNo(),
                        product.getMemberEmail()
                );
                return;
            }

            var mission = messageMissionService.createMission(
                    MessageRequestDTO.builder()
                            .source(MissionSource.RECALL)
                            .to(setting.getNotificationPhone())
                            .content(recallNoticeContent(product))
                            .build(),
                    product.getMemberEmail()
            );

            var result = messageMissionDispatchService.dispatch(mission);

            log.info(
                    "리콜 알림 발송: productNo={}, missionId={}, status={}",
                    product.getProductNo(),
                    result.getMissionId(),
                    result.getStatus()
            );
        } catch (Exception exception) {
            log.warn(
                    "리콜 알림 발송 실패: productNo={}, reason={}",
                    product.getProductNo(),
                    exception.getMessage()
            );
        }
    }

    private String recallNoticeContent(MyProduct product) {
        return "[리콜 알림] "
                + product.getProductName()
                + " - "
                + product.getRecallTitle();
    }
}
