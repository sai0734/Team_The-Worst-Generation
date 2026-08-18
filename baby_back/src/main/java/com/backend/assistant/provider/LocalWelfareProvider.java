package com.backend.assistant.provider;

import com.backend.assistant.client.DataGoKrClient;
import com.backend.assistant.domain.AssistCategory;
import com.backend.assistant.dto.AssistItemDTO;
import com.backend.assistant.dto.AssistRecommendRequest;
import com.backend.assistant.util.AssistRegionNames;
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
public class LocalWelfareProvider implements AssistDataProvider {

    private static final String URL =
            "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist";

    private final DataGoKrClient client;

    @Override
    public AssistCategory category() {
        return AssistCategory.SUBSIDY;
    }

    @Override
    public List<AssistItemDTO> search(AssistRecommendRequest request) {
        try {
            String sido = AssistRegionNames.sido(
                    request.getChild() != null ? request.getChild().getRegionSido() : "");
            String sgg = AssistRegionNames.sigungu(
                    request.getChild() != null ? request.getChild().getRegionSigungu() : "");

            Map<String, String> p = DataGoKrClient.page(1, 50);
            p.put("callTp", "L");
            p.put("srchKeyCode", "001");
            p.put("lifeArray", "001");
            if (!sido.isBlank()) {
                p.put("ctpvNm", sido);
            }
            if (!sgg.isBlank()) {
                p.put("sggNm", sgg);
            }

            List<AssistItemDTO> list = new ArrayList<>();
            for (JsonObject it : client.items(client.get(URL, p))) {
                if (!matchesRegion(it, sido, sgg)) {
                    continue;
                }
                String title = text(it, "servNm");
                if (title.isBlank()) continue;
                String id = text(it, "servId");
                String summary = text(it, "servDgst");
                String link = text(it, "servDtlLink");
                String area = (text(it, "ctpvNm") + " " + text(it, "sggNm")).trim();
                list.add(AssistItemDTO.builder()
                        .id(id.isBlank() ? title : id)
                        .category(category().name())
                        .title(title)
                        .summary(summary.isBlank()
                                ? (area.isBlank() ? "지자체 복지서비스" : area)
                                : (area.isBlank() ? summary : area + " · " + summary))
                        .status("APPLY")
                        .source("복지로 지자체")
                        .link(link.isBlank() ? "https://www.bokjiro.go.kr" : link)
                        .build());
            }
            return list;
        } catch (Exception e) {
            log.error("지자체 복지 API 실패", e);
            return List.of();
        }
    }

    private static boolean matchesRegion(JsonObject it, String sido, String sgg) {
        if (sido.isBlank()) {
            return true;
        }
        String itemSido = text(it, "ctpvNm");
        String itemSgg = text(it, "sggNm");
        if (!containsIgnoreBlank(itemSido, sido) && !containsIgnoreBlank(sido, itemSido)) {
            return false;
        }
        if (sgg.isBlank()) {
            return true;
        }
        return containsIgnoreBlank(itemSgg, sgg) || containsIgnoreBlank(sgg, itemSgg);
    }

    private static boolean containsIgnoreBlank(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank()) {
            return false;
        }
        return a.contains(b) || b.contains(a);
    }

    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}
