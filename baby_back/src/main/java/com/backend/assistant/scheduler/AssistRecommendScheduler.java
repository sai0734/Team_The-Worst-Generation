package com.backend.assistant.scheduler;

import com.backend.global.ai.RagClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Log4j2
@RequiredArgsConstructor

public class AssistRecommendScheduler {

    private final RagClient ragClient;

    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Seoul")
    public void refreshDaily() {
        log.info("정부지원금 03:30 데이터 수집 및 재색인 배치 시작");
        RagClient.ReindexResult reindexResult = ragClient.reindex();
        if (!reindexResult.success()) {
            log.error(
                    "정부지원금 재색인 실패, 기존 색인 유지: running={}, reason={}",
                    reindexResult.running(),
                    reindexResult.message()
            );
            return;
        }

        log.info(
                "정부지원금 재색인 완료: total={}, inserted={}, updated={}, unchanged={}, deleted={}",
                reindexResult.totalCount(),
                reindexResult.insertedCount(),
                reindexResult.updatedCount(),
                reindexResult.unchangedCount(),
                reindexResult.deletedCount()
        );
        log.info("정부지원금 03:30 데이터 수집 및 재색인 배치 종료");
    }
}
