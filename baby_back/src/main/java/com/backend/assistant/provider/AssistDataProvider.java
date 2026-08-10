package com.backend.assistant.provider;

import com.backend.assistant.domain.AssistCategory;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;

import java.util.List;

public interface AssistDataProvider {
    AssistCategory category();      // 카테고리의 분야의 데이터를 가져온다
    List<AssistItemDTO> search(AssistRecommendRequest request);     // 어린이집/지원금 API가 오면 구현 클래스만 추가
}
