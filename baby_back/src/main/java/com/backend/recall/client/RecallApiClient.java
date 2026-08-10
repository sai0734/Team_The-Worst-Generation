package com.backend.recall.client;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.backend.recall.domain.CertConditionKey;
import com.backend.recall.domain.DomesticRecallConditionKey;
import com.backend.recall.domain.ForeignRecallConditionKey;
import com.backend.recall.dto.SafetyKoreaCertificationDTO;
import com.backend.recall.dto.SafetyKoreaDomesticRecallDTO;
import com.backend.recall.dto.SafetyKoreaForeignRecallDTO;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.log4j.Log4j2;

/**
 * 국가기술표준원 SafetyKorea(제품안전정보센터) Open API 클라이언트.
 * KC인증정보 / 국내리콜정보 / 국외리콜정보 조회를 제공한다.
 * (Open API 인터페이스 설계서 v2.0, 2025-06-30 기준)
 */
@Component
@Log4j2
public class RecallApiClient {

    @Value("${safetykorea.base-url}")
    private String baseUrl;

    @Value("${safetykorea.api-key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    private final Gson gson = new Gson();

    public List<SafetyKoreaCertificationDTO> searchCertifications(
        CertConditionKey conditionKey,
        String conditionValue
    ) {
        JsonElement resultData = call(
            "/cert/certificationList.json",
            "conditionKey", conditionKey.name(),
            "conditionValue", conditionValue
        );

        return parseList(resultData, SafetyKoreaCertificationDTO.class);
    }

    public SafetyKoreaCertificationDTO getCertificationDetail(String certNum) {

        JsonElement resultData = call("/cert/certificationDetail.json", "certNum", certNum);

        return gson.fromJson(resultData, SafetyKoreaCertificationDTO.class);
    }

    public List<SafetyKoreaDomesticRecallDTO> searchDomesticRecalls(
        DomesticRecallConditionKey conditionKey,
        String conditionValue
    ) {
        JsonElement resultData = call(
            "/recall/recallList.json",
            "conditionKey", conditionKey.name(),
            "conditionValue", conditionValue
        );

        return parseList(resultData, SafetyKoreaDomesticRecallDTO.class);
    }

    public SafetyKoreaDomesticRecallDTO getDomesticRecallDetail(String recallUid) {

        JsonElement resultData = call("/recall/recallDetail.json", "recallUid", recallUid);

        return gson.fromJson(resultData, SafetyKoreaDomesticRecallDTO.class);
    }

    public List<SafetyKoreaForeignRecallDTO> searchForeignRecalls(
        ForeignRecallConditionKey conditionKey,
        String conditionValue
    ) {
        JsonElement resultData = call(
            "/recall/fRecallList.json",
            "conditionKey", conditionKey.name(),
            "conditionValue", conditionValue
        );

        return parseList(resultData, SafetyKoreaForeignRecallDTO.class);
    }

    private JsonElement call(String path, String... keyValuePairs) {

        Map<String, String> params = new LinkedHashMap<>();

        for (int i = 0; i < keyValuePairs.length; i += 2) {
            params.put(keyValuePairs[i], keyValuePairs[i + 1]);
        }

        String query = params.entrySet().stream()
            .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
            .collect(Collectors.joining("&"));

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + path + "?" + query))
            .header("AuthKey", apiKey)
            .timeout(Duration.ofSeconds(10))
            .GET()
            .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            JsonObject body = JsonParser.parseString(response.body()).getAsJsonObject();

            String resultCode = body.get("resultCode").getAsString();

            if ("2004".equals(resultCode)) {
                return null;
            }

            if (!"2000".equals(resultCode)) {
                String resultMsg = body.has("resultMsg") ? body.get("resultMsg").getAsString() : "Unknown error";
                throw new IllegalStateException("SafetyKorea API 오류 (" + resultCode + "): " + resultMsg);
            }

            return body.get("resultData");

        } catch (IOException | InterruptedException e) {
            log.error("SafetyKorea API 호출 실패: " + e.getMessage());
            throw new IllegalStateException("SafetyKorea API에 연결할 수 없습니다. (" + baseUrl + ")", e);
        }
    }

    private <T> List<T> parseList(JsonElement resultData, Class<T> clazz) {

        if (resultData == null || resultData.isJsonNull()) {
            return List.of();
        }

        List<T> result = new ArrayList<>();

        for (JsonElement element : resultData.getAsJsonArray()) {
            result.add(gson.fromJson(element, clazz));
        }

        return result;
    }
}
