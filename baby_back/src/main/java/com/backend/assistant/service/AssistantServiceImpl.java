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
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssistantServiceImpl implements AssistantService {

    private final List<AssistDataProvider> providers;
    private final OpenClawClient openClawClient;
    private final AssistSnapshotMapper snapshotMapper;

    @Override
    public AssistRecommendresponse recommend(AssistRecommendRequest request) {
        Set<String> wanted = request.getCategories() == null || request.getCategories().isEmpty()
                ? Set.of("SUBSIDY", "CARE", "VACCINATION")
                : request.getCategories().stream().map(String::toUpperCase).collect(Collectors.toSet());

        List<AssistItemDTO> items = new ArrayList<>();
        for (AssistDataProvider p : providers) {
            if (wanted.contains(p.category().name())) {
                items.addAll(p.search(request));
            }
        }

        String sido = request.getChild() != null ? request.getChild().getRegionSido() : null;
        String sigungu = request.getChild() != null ? request.getChild().getRegionSigungu() : null;
        String region = ((sido == null ? "" : sido) + " " + (sigungu == null ? "" : sigungu)).trim();
        Integer months = request.getChild() != null ? request.getChild().getBabyMonths() : null;
        String babyName = request.getChild() != null ? request.getChild().getBabyName() : null;
        String gender = request.getChild() != null ? request.getChild().getGender() : null;

        if (items.isEmpty()) {
            return AssistRecommendresponse.builder()
                    .answer("현재 조건에서 바로 신청할 수 있는 지원금이 없습니다.")
                    .items(List.of())
                    .build();
        }

        int age = (months == null) ? 0 : months;
        List<AssistItemDTO> ranked = openClawClient.pick(age, region, babyName, gender, items);
        if (ranked == null) {
            return AssistRecommendresponse.builder()
                    .answer("OpenClaw Gateway가 꺼져 있어 맞춤 지원금을 고를 수 없습니다. ollama serve 후 openclaw gateway 를 켜 주세요.")
                    .items(List.of())
                    .build();
        }
        items = ranked;

        String answer;
        if (items.isEmpty()) {
            answer = "현재 조건에서 바로 신청할 수 있는 지원금이 없습니다.";
        } else if (!region.isBlank() && months != null) {
            answer = String.format(
                    "현재 거주지(%s) 및 자녀 월령(%s개월) 기준 신청 가능한 지원금입니다.",
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
        for (AssistSnapshot row : rows) {
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
                        ? "아직 저장된 맞춤 지원금이 없습니다. 거주지와 아이 정보를 넣은 뒤, 매일 오전 3시에 갱신됩니다."
                        : "저장된 맞춤 지원금입니다.")
                .items(items)
                .build();
    }

    @Override
    public void saveRegion(String email, String regionSido, String regionSigungu) {
        snapshotMapper.upsertRegion(AssistRegion.builder()
                .email(email)
                .regionSido(regionSido == null ? "" : regionSido.trim())
                .regionSigungu(regionSigungu == null ? "" : regionSigungu.trim())
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
