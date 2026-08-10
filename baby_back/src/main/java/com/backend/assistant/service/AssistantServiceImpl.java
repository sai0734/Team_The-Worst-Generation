package com.backend.assistant.service;

import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.provider.AssistDataProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class AssistantServiceImpl implements AssistantService{

    private final List<AssistDataProvider> providers;

    @Override
    public AssistRecommendresponse recommend(AssistRecommendRequest request) {
        Set<String> wanted = request.getCategories() == null
                ? Set.of()
                : request.getCategories().stream().map(String::toUpperCase).collect(Collectors.toSet());

        List<AssistItemDTO> items = new ArrayList<>();
        for(AssistDataProvider p : providers) {
            if (wanted.isEmpty() || wanted.contains(p.category().name())) {
                items.addAll(p.search(request));
            }
        }

        String region = request.getChild() != null ? request.getChild().getRegionSigungu() : "";
        String answer = items.isEmpty()
                ? "조건에 맞는 결과가 없습니다. (API연동전 STUB)"
                : String.format("'%s' 기준으로 %d건을 모았습니다. openclaw/공공API 연동 후 다시",
                region == null ? "입력 지역" : region, items.size());

        return AssistRecommendresponse.builder()
                .answer(answer)
                .items(items)
                .build();
    }
}
