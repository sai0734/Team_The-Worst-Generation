package com.backend.assistant.service;

import com.backend.assistant.domain.AssistRegion;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.dto.AssistRecommendresponse;
import com.backend.assistant.mapper.AssistSnapshotMapper;
import com.backend.assistant.util.AssistRegionNames;
import com.backend.global.ai.RagClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class AssistantServiceImpl implements AssistantService {

    private final AssistSnapshotMapper snapshotMapper;
    private final RagClient ragClient;

    @Override
    public AssistRecommendresponse ask(AssistRecommendRequest request) {
        AssistRecommendRequest.ChildContext child = request.getChild();
        int months = child != null && child.getBabyMonths() != null ? child.getBabyMonths() : 0;
        String sido = AssistRegionNames.sido(
                child != null ? child.getRegionSido() : "");
        RagClient.AskResult result = ragClient.ask(
                request.getQuery(),
                months,
                sido,
                child != null ? child.getRegionSigungu() : "",
                child != null ? child.getHouseholdSize() : null,
                child != null ? child.getMedianIncomeBand() : "UNKNOWN",
                child != null ? child.getHouseholdTypes() : List.of()
        );
        return AssistRecommendresponse.builder()
                .answer(result.answer())
                .items(result.sources())
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
