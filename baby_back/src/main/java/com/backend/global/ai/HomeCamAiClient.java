package com.backend.global.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

// 홈캠 안전영역 이탈 감지용 사람 탐지 서버 (ai/ai-server, homecam 모듈, YOLOv8 + OpenCV) 호출
@Component
@Log4j2
public class HomeCamAiClient {

    @Value("${homecam.ai-server.base-url}")
    private String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            // 자바 HttpClient가 기본으로 시도하는 h2c(cleartext HTTP/2) 업그레이드를
            // uvicorn이 못 알아들어서 body가 통째로 빈 걸로 처리되는 문제 방지
            .version(HttpClient.Version.HTTP_1_1)
            .build();

    // 탐지된 사람 한 명의 바운딩 박스 (프레임 대비 0~1 비율 좌표)
    public static class DetectedPerson {
        public final double confidence;
        public final double xRatio;
        public final double yRatio;
        public final double wRatio;
        public final double hRatio;

        public DetectedPerson(double confidence, double xRatio, double yRatio, double wRatio, double hRatio) {
            this.confidence = confidence;
            this.xRatio = xRatio;
            this.yRatio = yRatio;
            this.wRatio = wRatio;
            this.hRatio = hRatio;
        }
    }

    public static class DetectResult {
        public final List<DetectedPerson> people;
        public final String modelVersion;

        public DetectResult(List<DetectedPerson> people, String modelVersion) {
            this.people = people;
            this.modelVersion = modelVersion;
        }
    }

    // 카메라 전체 프레임을 보내 "사람"으로 탐지된 위치(비율 좌표) 목록을 받아온다.
    // 안전영역 사각형과 겹치는지 판정은 여기서 하지 않고 HomeCamAnalyzeService가 한다.
    public DetectResult detectPeople(String imageBase64) {

        JsonObject body = new JsonObject();
        body.addProperty("imageBase64", imageBase64);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/homecam/analyze"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("홈캠 AI서버 응답 오류: HTTP " + response.statusCode() + " " + response.body());
            }

            JsonObject responseBody = JsonParser.parseString(response.body()).getAsJsonObject();

            List<DetectedPerson> people = new ArrayList<>();
            JsonArray peopleArray = responseBody.getAsJsonArray("people");
            for (JsonElement e : peopleArray) {
                JsonObject p = e.getAsJsonObject();
                people.add(new DetectedPerson(
                        p.get("confidence").getAsDouble(),
                        p.get("xRatio").getAsDouble(),
                        p.get("yRatio").getAsDouble(),
                        p.get("wRatio").getAsDouble(),
                        p.get("hRatio").getAsDouble()
                ));
            }

            String modelVersion = responseBody.get("modelVersion").getAsString();

            return new DetectResult(people, modelVersion);

        } catch (java.io.IOException | InterruptedException e) {
            log.error("홈캠 AI서버 호출 실패: " + e.getMessage());
            throw new IllegalStateException("홈캠 AI서버에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }
}
