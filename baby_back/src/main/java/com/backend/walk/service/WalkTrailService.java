package com.backend.walk.service;

import com.backend.global.ai.OllamaClient;
import com.backend.walk.client.KakaoLocalClient;
import com.backend.walk.client.KakaoPlace;
import com.backend.walk.client.WeatherClient;
import com.backend.walk.dto.WalkAiRecommendationDTO;
import com.backend.walk.dto.WalkPlaceDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class WalkTrailService implements WalkTrailServiceImpl {

    private static final int AI_SEARCH_RADIUS_M = 1200; // 도보 약 30분 거리 상한(직선거리 기준 + 도로 우회 안전 마진)

    private final KakaoLocalClient kakaoLocalClient;
    private final WeatherClient weatherClient;
    private final OllamaClient ollamaClient;

    @Override
    public WalkAiRecommendationDTO recommendWithAi(double lat, double lng) {

        List<KakaoPlace> candidates = kakaoLocalClient.searchNearbyParks(lat, lng, AI_SEARCH_RADIUS_M).stream()
                .filter(p -> p.distanceM() <= AI_SEARCH_RADIUS_M)
                .filter(p -> p.category().startsWith("여행 > 공원"))
                .toList();

        if (candidates.isEmpty()) {
            return WalkAiRecommendationDTO.builder()
                    .answer("도보 30분 이내에서 추천할 만한 공원을 찾지 못했습니다.")
                    .places(List.of())
                    .build();
        }

        Map<String, String> weather;
        try {
            weather = weatherClient.getCurrentWeather(lat, lng);
        } catch (Exception e) {
            log.warn("날씨 조회 실패, 날씨 정보 없이 진행: {}", e.getMessage());
            weather = Map.of();
        }

        String answer;
        try {
            answer = ollamaClient.chat(buildPrompt(candidates, weather));
        } catch (Exception e) {
            log.warn("AI 코멘트 생성 실패, 코멘트 없이 장소 목록만 반환: {}", e.getMessage());
            answer = "AI 코멘트를 불러오지 못했습니다. 아래 후보 장소를 참고해주세요.";
        }

        List<WalkPlaceDTO> places = candidates.stream()
                .map(p -> WalkPlaceDTO.builder()
                        .name(p.name())
                        .address(p.address())
                        .latitude(p.latitude())
                        .longitude(p.longitude())
                        .distanceM(p.distanceM())
                        .build())
                .toList();

        return WalkAiRecommendationDTO.builder()
                .answer(answer)
                .places(places)
                .temperature(weather.get("T1H"))
                .precipitationType(describePrecipitation(weather.get("PTY")))
                .humidity(weather.get("REH"))
                .build();
    }

    private String describePrecipitation(String code) {
        if (code == null) return null;
        return switch (code) {
            case "0" -> "없음";
            case "1" -> "비";
            case "2" -> "비/눈";
            case "3" -> "눈";
            case "5" -> "빗방울";
            case "6" -> "빗방울눈날림";
            case "7" -> "눈날림";
            default -> "정보없음";
        };
    }

    private String buildPrompt(List<KakaoPlace> candidates, Map<String, String> weather) {
        StringBuilder sb = new StringBuilder();
        sb.append("너는 육아 산책로 추천 도우미야. 아래 후보 장소 중 지금 조건에 가장 적합한 곳을 골라 ")
                .append("이유와 함께 2~3문장으로 한국어로 짧게 답해줘.\n\n");

        if (!weather.isEmpty()) {
            sb.append("현재 기온: ").append(weather.getOrDefault("T1H", "정보없음")).append("도\n");
            sb.append("강수형태 코드(0=없음,1=비,2=비/눈,3=눈,5=빗방울,6=빗방울눈날림,7=눈날림): ")
                    .append(weather.getOrDefault("PTY", "정보없음")).append("\n");
            sb.append("습도: ").append(weather.getOrDefault("REH", "정보없음")).append("%\n");
        }

        sb.append("\n후보 장소 목록:\n");
        for (KakaoPlace p : candidates) {
            sb.append("- ").append(p.name())
                    .append(" (").append(p.address()).append(", 거리 ")
                    .append(Math.round(p.distanceM())).append("m)\n");
        }
        return sb.toString();
    }
}