package com.backend.assistant.provider;

import com.backend.assistant.client.DataGoKrClient;
import com.backend.assistant.domain.AssistCategory;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.google.gson.JsonObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Log4j2
public class NationalWelfareProvider implements AssistDataProvider {

    private static final String URL =
            "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001";

    private final DataGoKrClient client;

    @Override
    public AssistCategory category() {
        return AssistCategory.SUBSIDY;
    }

    @Override
    public List<AssistItemDTO> search(AssistRecommendRequest request) {
        try {
            Map<String, String> p = DataGoKrClient.page(1, 20);
            p.put("callTp", "L");
            p.put("srchKeyCode", "001");
            p.put("lifeArray", "001");

            List<AssistItemDTO> list = new ArrayList<>();
            for (JsonObject it : client.items(client.get(URL, p))) {
                String title = text(it, "servNm");
                if (title.isBlank()) continue;
                String id = text(it, "servId");
                String summary = text(it, "servDgst");
                String link = text(it, "servDtlLink");
                list.add(AssistItemDTO.builder()
                        .id(id.isBlank() ? title : id)
                        .category(category().name())
                        .title(title)
                        .summary(summary.isBlank() ? "중앙부처 복지서비스" : summary)
                        .status("APPLY")
                        .source("복지로 중앙부처")
                        .link(link.isBlank() ? "https://www.bokjiro.go.kr" : link)
                        .build());
            }
            return list;
        } catch (Exception e) {
            log.error("중앙부처 복지 API 실패", e);
            return List.of();
        }
    }

    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}
