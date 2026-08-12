package com.backend.ledger.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.backend.allergy.client.VisionApiClient;
import com.backend.global.ai.OllamaClient;
import com.backend.ledger.domain.LedgerCategory;
import com.backend.ledger.domain.LedgerType;
import com.backend.ledger.dto.LedgerClassifyResponseDTO;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
public class LedgerOcrServiceImpl implements LedgerOcrService {

    private final VisionApiClient visionApiClient;

    private final OllamaClient ollamaClient;

    @Override
    public List<LedgerClassifyResponseDTO> extractFromReceipt(MultipartFile image) {

        byte[] imageBytes = readImageBytes(image);

        String rawText = visionApiClient.extractText(imageBytes);

        if (rawText == null || rawText.isBlank()) {
            return List.of();
        }

        String categoryList = String.join(", ",
            java.util.Arrays.stream(LedgerCategory.values()).map(Enum::name).toArray(String[]::new));

        String prompt = """
            아래는 영수증에서 OCR로 추출한 텍스트야. 최종 금액 계산은 하지 말고, 아래 항목들을 영수증에 적힌 그대로만 뽑아줘.

            - storeName: 가게 이름. 브랜드명(로고, 상호명)과 그 아래 지점명(예: "OO점", "OODT점")이 둘 다 있으면 붙여서 써줘 (예: "스타벅스 영도청학DT점"). 상호명이 전혀 없으면 구매한 상품 중 대표적인 상품명 하나를 대신 써줘 — 이 경우 그 상품명은 items 배열에는 넣지 마 (중복 방지).
            - items: 실제로 구매한 상품명 배열 (storeName으로 이미 쓴 상품명은 제외, 서비스로 무료 제공된 항목은 포함). 상품명 앞뒤에 붙은 사이즈/옵션 코드나 기호(예: "T)", "I-G)", "[S]", "(HOT)")는 빼고 순수한 이름만.
            - total: "합계" 또는 "결제금액"이라고 적힌 숫자 그대로 (없으면 null). "과세물품가액"/"면세물품가액"/"부가세"/"공급가액"은 total이 아니니까 여기 쓰지 마.
            - discount: "할인금액"이라고 적힌 숫자 그대로 (없으면 0).
            - category: 다음 목록 중 하나: %s

            설명 없이 아래 형식의 JSON 객체 하나만 출력해줘.
            {"storeName": "남도연프리미엄", "items": ["간장꼬막정식", "콜라"], "total": 36000, "discount": 2000, "category": "FOOD"}
            영수증에서 total을 전혀 찾을 수 없으면 total을 null로 해줘.

            영수증 텍스트:
            %s
            """.formatted(categoryList, rawText);

        try {
            String raw = ollamaClient.chat(prompt);
            JsonObject json = parseJsonObject(raw);

            LedgerClassifyResponseDTO result = toClassifyResponse(json);

            return result.getAmount() != null ? List.of(result) : List.of();

        } catch (Exception e) {
            log.warn("영수증 OCR 분류 실패: {}", e.getMessage());
            return List.of();
        }
    }

    private byte[] readImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    private LedgerClassifyResponseDTO toClassifyResponse(JsonObject json) {

        LedgerCategory category = json.has("category") && !json.get("category").isJsonNull()
            ? LedgerCategory.valueOf(json.get("category").getAsString())
            : LedgerCategory.ETC;

        Integer total = (json.has("total") && !json.get("total").isJsonNull())
            ? json.get("total").getAsInt()
            : null;
        int discount = (json.has("discount") && !json.get("discount").isJsonNull())
            ? json.get("discount").getAsInt()
            : 0;
        Integer amount = total != null ? Math.max(total - discount, 0) : null;

        String storeName = (json.has("storeName") && !json.get("storeName").isJsonNull())
            ? json.get("storeName").getAsString()
            : null;

        List<String> items = new ArrayList<>();
        if (json.has("items") && json.get("items").isJsonArray()) {
            for (JsonElement item : json.getAsJsonArray("items")) {
                if (!item.isJsonNull() && !item.getAsString().equals(storeName)) {
                    items.add(item.getAsString());
                }
            }
        }

        String description = storeName;
        if (storeName != null && !items.isEmpty()) {
            description = storeName + "(" + String.join(", ", items) + ")";
        }

        return LedgerClassifyResponseDTO.builder()
            .type(LedgerType.EXPENSE)
            .category(category)
            .amount(amount)
            .description(description)
            .build();
    }

    private JsonObject parseJsonObject(String raw) {

        String trimmed = raw.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');

        if (start == -1 || end == -1 || end < start) {
            throw new IllegalStateException("AI 응답에서 JSON을 찾을 수 없습니다: " + raw);
        }

        return JsonParser.parseString(trimmed.substring(start, end + 1)).getAsJsonObject();
    }
}
