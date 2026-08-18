package com.backend.assistant.config;

import com.backend.assistant.mapper.AssistSnapshotMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Log4j2
public class AssistRegionMigrator implements ApplicationRunner {

    private final AssistSnapshotMapper snapshotMapper;

    @Override
    public void run(ApplicationArguments args) {
        try {
            snapshotMapper.ensureBabyMonthsColumn();
            log.info("tbl_assist_region.baby_months 컬럼 확인 완료");
        } catch (Exception e) {
            log.warn("baby_months 컬럼 확인 실패(아이 등록은 계속 진행): {}", e.getMessage());
        }
    }
}
