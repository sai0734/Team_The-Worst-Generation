package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.domain.AssistSnapshot;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.mapper.AssistSnapshotMapper;
import com.backend.babyInfo.domain.BabyInfo;
import com.backend.babyInfo.mapper.BabyInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Log4j2

public class AssistBatchServiceImpl implements AssistBatchService {

    static final long DASHBOARD_BABY_NO = 0L;

    private final AssistSnapshotMapper snapshotMapper;
    private final AssistantService assistantService;
    private final BabyInfoMapper babyInfoMapper;
    private final AtomicBoolean running = new AtomicBoolean(false);

    @Override
    public void refreshAll() {
        if (!running.compareAndSet(false, true)) {
            log.warn("이전 지원금 배치가 아직 실행중이라 건너뛴다.");
            return;
        }
        try {
            List<String> emails = snapshotMapper.selectRegionEmails();
            if (emails == null) {
                return;
            }
            for (String email : emails) {
                try {
                    refreshEmail(email);
                } catch (Exception e) {
                    log.warn("지원금 배치 실패 email={}: {}", email, e.getMessage());
                }
            }
        } finally {
            running.set(false);
        }
    }

    @Override
    public void refreshEmail(String email) {
        AssistRegion region = snapshotMapper.selectRegion(email);
        AssistRecommendRequest req = new AssistRecommendRequest();
        req.setCategories(List.of("SUBSIDY", "CARE"));
        AssistRecommendRequest.ChildContext child = new AssistRecommendRequest.ChildContext();

        BabyInfo baby = findYoungestBaby(email);
        if (baby != null) {
            child.setBabyName(baby.getBabyName());
            child.setGender(baby.getGender());
            child.setBabyMonths(ageInMonths(baby.getBirthDate(), LocalDate.now()));
        } else {
            child.setBabyName("아이");
            child.setBabyMonths(region != null && region.getBabyMonths() != null
            ? region.getBabyMonths() : 6);
        }
        if (region != null) {
            child.setRegionSido(region.getRegionSido());
            child.setRegionSigungu(region.getRegionSigungu());
        }
        req.setChild(child);

        AssistRecommendresponse res = assistantService.recommend(req);
        if (res.getItems() == null || res.getItems().isEmpty()) {
            log.warn("지원금 목록이 비어 기존 스냅샷 유지 email={}", email);
            return;
        }
        snapshotMapper.deleteByBaby(email, DASHBOARD_BABY_NO);
        int i=0;
        for (AssistItemDTO it : res.getItems()) {
            String id = it.getId();
            if (id == null || id.isBlank()) {
                id = "item-" + (++i);
            }
            snapshotMapper.insert(AssistSnapshot.builder()
                    .email(email)
                    .babyNo(DASHBOARD_BABY_NO)
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

    private BabyInfo findYoungestBaby(String email) {
        List<BabyInfo> babies = babyInfoMapper.selectList(email);
        if (babies == null || babies.isEmpty()){
            return null;
        }
        return babies.stream()
                .max(Comparator.comparing((BabyInfo b) -> b.getBirthDate() == null ? LocalDate.MIN : b.getBirthDate()))
                .orElse(babies.get(0));
    }

    private static int ageInMonths(LocalDate birth, LocalDate today) {
        if (birth == null) {
            return 0;
        }
        int months = (today.getYear() - birth.getYear()) * 12
                + (today.getMonthValue() - birth.getMonthValue());
        if (today.getDayOfMonth() < birth.getDayOfMonth()){
            months--;
        }
        return Math.max(months, 0);
    }
}
