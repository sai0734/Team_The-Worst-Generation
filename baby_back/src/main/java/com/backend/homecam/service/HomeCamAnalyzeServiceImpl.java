package com.backend.homecam.service;

import java.lang.reflect.Type;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.backend.global.ai.HomeCamAiClient;
import com.backend.homecam.domain.HomeCamSafeZone;
import com.backend.homecam.dto.HomeCamAnalyzeResultDTO;
import com.backend.homecam.mapper.HomeCamSafeZoneMapper;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class HomeCamAnalyzeServiceImpl implements HomeCamAnalyzeService {

    // 이 값 밑으로 유사도가 떨어지면 "기준 상태와 달라짐(이탈 의심)"으로 판단
    // (프론트에서 연속 몇 프레임 이상일 때만 실제 알람을 울리도록 한번 더 걸러냄)
    private static final double SIMILARITY_THRESHOLD = 0.75;

    private static final Type EMBEDDING_LIST_TYPE = new TypeToken<List<Double>>() {}.getType();

    private final HomeCamSafeZoneMapper homeCamSafeZoneMapper;

    private final HomeCamAiClient homeCamAiClient;

    private final Gson gson = new Gson();

    @Override
    public void captureBaseline(String email, String baselineImageBase64) {

        HomeCamAiClient.AnalyzeResult result = homeCamAiClient.analyze(baselineImageBase64, null);

        homeCamSafeZoneMapper.updateBaseline(
                email,
                gson.toJson(result.embedding),
                result.modelVersion
        );
    }

    @Override
    public HomeCamAnalyzeResultDTO analyze(String email, String imageBase64) {

        HomeCamSafeZone zone = homeCamSafeZoneMapper.selectByEmail(email);

        if (zone == null || zone.getBaselineEmbedding() == null) {
            return HomeCamAnalyzeResultDTO.builder()
                    .ready(false)
                    .build();
        }

        List<Double> baselineEmbedding = gson.fromJson(zone.getBaselineEmbedding(), EMBEDDING_LIST_TYPE);

        HomeCamAiClient.AnalyzeResult result = homeCamAiClient.analyze(imageBase64, baselineEmbedding);

        boolean outOfZone = result.similarity == null || result.similarity < SIMILARITY_THRESHOLD;

        return HomeCamAnalyzeResultDTO.builder()
                .ready(true)
                .similarity(result.similarity)
                .outOfZone(outOfZone)
                .build();
    }
}
