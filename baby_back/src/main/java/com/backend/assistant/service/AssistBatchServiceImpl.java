package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.domain.AssistSnapshot;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.mapper.AssistSnapshotMapper;
import com.backend.babyInfo.domain.BabyInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2

public class AssistBatchServiceImpl implements AssistBatchService{

    private final AssistSnapshotMapper snapshotMapper;
    private final AssistantService assistantService;


    @Override
    public void refreshAll() {
        List<BabyInfo> babies = snapshotMapper.selectBabies();
        for (BabyInfo baby : babies) {
            try {
                refreshOne(baby);
            } catch(Exception e) {
                log.warn("지원금 배치 실패 babyNo = {}: {}", baby.getBabyNo(), e.getMessage());
            }
        }
    }

    private void refreshOne(BabyInfo baby) {
        AssistRecommendRequest req = new AssistRecommendRequest();
        req.setCategories(List.of("SUBSIDY", "CARE", "VACCINATION"));
        AssistRecommendRequest.ChildContext child = new AssistRecommendRequest.ChildContext();
        child.setBabyMonths(monthsFromBirth(baby.getBirthDate()));
        child.setBabyName(baby.getBabyName());
        child.setGender(baby.getGender());

        AssistRegion region = snapshotMapper.selectRegion(baby.getEmail());
        if (region != null) {
            child.setRegionSido(region.getRegionSido());
            child.setRegionSigungu(region.getRegionSigungu());
        }
        req.setChild(child);

        AssistRecommendresponse res = assistantService.recommend(req);
        if (res.getAnswer() != null && res.getAnswer().contains("OpenClaw Gateway")) {
            log.warn("OpenClaw 실패, 기존 스냅샷 유지 babyNo={}", baby.getBabyNo());
            return;
        }
        snapshotMapper.deleteByBaby(baby.getEmail(), baby.getBabyNo());
        if (res.getItems() == null) return;
        int i = 0;
        for (AssistItemDTO it : res.getItems()) {
            String id = it.getId();
            if (id == null || id.isBlank()) {
                id = "item-" + (++i);
            }
            snapshotMapper.insert(AssistSnapshot.builder()
                    .email(baby.getEmail())
                    .babyNo(baby.getBabyNo())
                    .itemId(id)
                    .category(it.getCategory())
                    .title(it.getTitle())
                    .summary(it.getSummary())
                    .link(it.getLink())
                    .status(it.getStatus())
                    .source(it.getSource())
                    .build());
        }
    }

    private static int monthsFromBirth(LocalDate birth) { //태어난 날부터 지금까지 개월수로 바꿔줌
        if (birth == null) return 6;
        LocalDate now = LocalDate.now();
        return Math.max(0,(now.getYear() - birth.getYear()) * 12 + (now.getMonthValue() - birth.getMonthValue()));
    }
}

