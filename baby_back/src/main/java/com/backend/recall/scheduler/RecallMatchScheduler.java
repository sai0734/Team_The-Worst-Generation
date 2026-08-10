package com.backend.recall.scheduler;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.backend.recall.service.MyProductService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Component
@Log4j2
@RequiredArgsConstructor
public class RecallMatchScheduler {

    private final MyProductService myProductService;

    @Scheduled(cron = "0 0 3 * * *")
    public void recheckUnmatchedProducts() {

        log.info("리콜 재검사 배치 시작");
        myProductService.recheckAll();
        log.info("리콜 재검사 배치 종료");
    }
}
