package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.domain.AssistSnapshot;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.mapper.AssistSnapshotMapper;
import com.backend.assistant.provider.AssistDataProvider;
import com.backend.global.ai.OpenClawClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class AssistantServiceImpl implements AssistantService {

    private final List<AssistDataProvider> providers;
    private final OpenClawClient openClawClient;
    private final AssistSnapshotMapper snapshotMapper;

    @Value("${data.go.kr.service-key:}")
    private String dataGoKrKey;

    @Override
    public AssistRecommendresponse recommend(AssistRecommendRequest request) {
        Set<String> wanted = request.getCategories() == null || request.getCategories().isEmpty()
                ? Set.of("SUBSIDY", "CARE", "VACCINATION")
                : request.getCategories().stream().map(String::toUpperCase).collect(Collectors.toSet());

        List<AssistItemDTO> items = new ArrayList<>();
        for (AssistDataProvider p : providers) {
            if (wanted.contains(p.category().name())) {
                List<AssistItemDTO> found = p.search(request);
                log.info("provider={} category={} count={}",
                        p.getClass().getSimpleName(), p.category(), found.size());
                items.addAll(found);
            }
        }

        String sido = request.getChild() != null ? request.getChild().getRegionSido() : null;
        String sigungu = request.getChild() != null ? request.getChild().getRegionSigungu() : null;
        String region = ((sido == null ? "" : sido) + " " + (sigungu == null ? "" : sigungu)).trim();
        Integer months = request.getChild() != null ? request.getChild().getBabyMonths() : null;
        String babyName = request.getChild() != null ? request.getChild().getBabyName() : null;
        String gender = request.getChild() != null ? request.getChild().getGender() : null;

        if (items.isEmpty()) {
            String emptyAnswer = (dataGoKrKey == null || dataGoKrKey.isBlank())
                    ? "공공데이터 키가 없어 지원금 목록을 가져오지 못했습니다. DATA_GO_KR_SERVICE_KEY를 확인하세요."
                    : "현재 조건에서 바로 신청할 수 있는 지원금이 없습니다.";
            return AssistRecommendresponse.builder()
                    .answer(emptyAnswer)
                    .items(List.of())
                    .build();
        }

        int age = (months == null) ? 0 : months;
        List<AssistItemDTO> ranked = openClawClient.pick(age, region, babyName, gender, items);
        if (ranked == null) {
            log.warn("OpenClaw 실패, 공공 API 목록을 그대로 사용");
        } else if (ranked.isEmpty()) {
            log.warn("OpenClaw가 항목을 모두 걸러 공공 API 목록을 유지");
        } else {
            items = ranked;
        }

        String answer;
        if (items.isEmpty()) {
            answer = "현재 조건에서 바로 신청할 수 있는 지원금이 없습니다.";
        } else if (!region.isBlank() && months != null) {
            answer = String.format(
                    "현재 거주지(%s) 및 아이 나이(%s개월) 기준 신청 가능한 지원금입니다.",
                    region, months);
        } else {
            answer = "신청 가능한 지원금입니다.";
        }

        return AssistRecommendresponse.builder()
                .answer(answer)
                .items(items)
                .build();
    }

    @Override
    public AssistRecommendresponse loadSnapshot(String email) {
        List<AssistSnapshot> rows = snapshotMapper.selectByEmail(email);
        List<AssistItemDTO> items = new ArrayList<>();
        LocalDateTime updatedAt = null;
        for (AssistSnapshot row : rows) {
            if (updatedAt == null) {
                updatedAt = row.getUpdatedAt();
            }
            items.add(AssistItemDTO.builder()
                    .id(row.getItemId())
                    .category(row.getCategory())
                    .title(row.getTitle())
                    .summary(row.getSummary())
                    .link(row.getLink())
                    .status(row.getStatus())
                    .source(row.getSource())
                    .build());
        }
        return AssistRecommendresponse.builder()
                .answer(items.isEmpty()
                        ? "아이 나이와 거주지를 입력하고 정책 찾기를 눌러 주세요."
                        : "저장된 맞춤 지원금입니다.")
                .items(items)
                .updatedAt(updatedAt)
                .build();
    }

    @Override
    public void saveRegion(String email, String regionSido, String regionSigungu, Integer babyMonths) {
        snapshotMapper.upsertRegion(AssistRegion.builder()
                .email(email)
                .regionSido(regionSido == null ? "" : regionSido.trim())
                .regionSigungu(regionSigungu == null ? "" : regionSigungu.trim())
                .babyMonths(babyMonths)
                .build());
    }

    @Override
    public AssistRegion loadRegion(String email) {
        AssistRegion row = snapshotMapper.selectRegion(email);
        return row != null ? row : AssistRegion.builder()
                .email(email)
                .regionSido("")
                .regionSigungu("")
                .build();
    }
}
