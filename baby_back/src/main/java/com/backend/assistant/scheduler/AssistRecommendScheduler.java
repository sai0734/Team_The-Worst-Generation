package com.backend.assistant.scheduler;

import com.backend.assistant.service.AssistBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Log4j2
@RequiredArgsConstructor

public class AssistRecommendScheduler {

    private final AssistBatchService assistBatchService;

    @Scheduled(cron = "0 0 3 * * *")
    public void refreshDaily() {
        log.info("정부지원금 재조회 배치 시작");
        assistBatchService.refreshAll();
        log.info("정부지원금 재조회 배치 종료");
    }
}
