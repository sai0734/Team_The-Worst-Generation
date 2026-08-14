package com.backend.assistant.service;

import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
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

    @Override
    public AssistRecommendresponse recommend(AssistRecommendRequest request) {
        Set<String> wanted = request.getCategories() == null || request.getCategories().isEmpty()
                ? Set.of("SUBSIDY")
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

        int age = (months == null) ? 0 : months;
        List<AssistItemDTO> ranked = openClawClient.pick(age, region, items);
        if (ranked != null) {
            items = ranked;
        }

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
}
