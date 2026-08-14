package com.backend.recall.service;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.backend.allergy.client.VisionApiClient;
import com.backend.global.ai.OllamaClient;
import com.backend.global.util.CustomFileUtil;
import com.backend.recall.dto.RecallOcrResultDTO;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@Log4j2
@RequiredArgsConstructor
public class RecallOcrServiceImpl implements RecallOcrService {

    private final VisionApiClient visionApiClient;

    private final OllamaClient ollamaClient;

    private final CustomFileUtil customFileUtil;

    @Override
    public RecallOcrResultDTO extract(MultipartFile image) {

        byte[] imageBytes = readImageBytes(image);
        String imageName = saveImage(image);

        String rawText = visionApiClient.extractText(imageBytes);

        if (rawText == null || rawText.isBlank()) {
            return RecallOcrResultDTO.builder().rawText("").imageName(imageName).build();
        }

        String prompt = """
            아래는 육아용품 박스 라벨에서 OCR로 추출한 텍스트야.
            이 텍스트에서 제품명, 브랜드명(제조사), 모델명, 인증번호(KC 인증번호)를 찾아줘.
            찾을 수 없는 항목은 null로 해줘.
            설명 없이 아래 형식의 JSON 객체만 출력해줘.
            {"productName": "...", "brandName": "...", "modelName": "...", "certNum": "..."}

            OCR 텍스트:
            %s
            """.formatted(rawText);

        try {
            String raw = ollamaClient.chat(prompt);
            JsonObject json = parseJsonObject(raw);

            return RecallOcrResultDTO.builder()
                .productName(nullableString(json, "productName"))
                .brandName(nullableString(json, "brandName"))
                .modelName(nullableString(json, "modelName"))
                .certNum(nullableString(json, "certNum"))
                .rawText(rawText)
                .imageName(imageName)
                .build();

        } catch (Exception e) {
            log.warn("리콜 OCR 필드 추출 실패: {}", e.getMessage());
            return RecallOcrResultDTO.builder().rawText(rawText).imageName(imageName).build();
        }
    }

    private String saveImage(MultipartFile image) {
        try {
            List<String> saved = customFileUtil.saveFiles(List.of(image));
            return saved == null ? null : saved.get(0);
        } catch (RuntimeException e) {
            log.warn("리콜 OCR 이미지 저장 실패: {}", e.getMessage());
            return null;
        }
    }

    private byte[] readImageBytes(MultipartFile image) {
        try {
            return image.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("이미지 파일을 읽는 중 오류가 발생했습니다.", e);
        }
    }

    private String nullableString(JsonObject json, String key) {
        return (json.has(key) && !json.get(key).isJsonNull()) ? json.get(key).getAsString() : null;
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
