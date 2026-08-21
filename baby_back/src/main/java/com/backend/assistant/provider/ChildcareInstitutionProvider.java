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

public class ChildcareInstitutionProvider implements AssistDataProvider {

    private static final String URL =
            "https://apis.data.go.kr/1383000/idis/serviceInstitutionService/getServiceInstitutionList";

    private final DataGoKrClient client;

    @Override
    public AssistCategory category() {
        return AssistCategory.CARE;
    }

    @Override
    public List<AssistItemDTO> search(AssistRecommendRequest request) {
        try {
            String sido = AssistRegionNames.sido(
                    request.getChild() != null ? request.getChild().getRegionSido() : "");
            String sgg = AssistRegionNames.sigungu(
                    request.getChild() != null ? request.getChild().getRegionSigungu() : "");
            if (sido.isBlank() && sgg.isBlank()) {
                return List.of();
            }
            Map<String, String> p = DataGoKrClient.page(1, 500);

            List<AssistItemDTO> list = new ArrayList<>();
            for (JsonObject it : client.items(client.get(URL, p))) {
                if (!matchesRegion(it, sido, sgg)) {
                    continue;
                }
                String name = first(it, "childCareInstNm", "instNm", "ogdpNm");
                if (name.isBlank()) continue;
                String addr = first(it, "addr", "roadNmAddr", "lotnoAddr");
                list.add(AssistItemDTO.builder()
                        .id("care-" + name)
                        .category(category().name())
                        .title("아이돌봄제공기관 * " + name)
                        .summary(addr.isBlank() ? "거주지 인근 아이돌봄기관" : addr)
                        .status("APPLY")
                        .source("아이돌봄 서비스제공기관")
                        .link("https://www.idolbom.go.kr")
                        .build());
            }
            return list;
        } catch (Exception e) {
            log.error("아이돌봄기관 API 실패", e);
            return List.of();
        }
    }

    private static boolean matchesRegion(JsonObject it, String sido, String sgg) {
        if (sido.isBlank()) {
            return true;
        }
        String itemSido = text(it, "ctpvNm");
        if (!containsIgnoreBlank(itemSido, sido) && !containsIgnoreBlank(sido, itemSido))
            return false;

        if (sgg.isBlank()) {
            return true;
        }
        String itemSgg = text(it, "sggNm");
        return containsIgnoreBlank(itemSgg, sgg) || containsIgnoreBlank(sgg, itemSgg);
    }

    private static boolean containsIgnoreBlank(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank()) {
            return false;
        }
        return a.contains(b) || b.contains(a);
    }

    private static String first(JsonObject o, String... keys) {
        for (String key : keys) {
            if (o.has(key) && !o.get(key).isJsonNull()) {
                String v = o.get(key).getAsString();
                if (v != null && !v.isBlank()) return v;
            }
        }
        return "";
    }

    private static String text(JsonObject o, String key) {
        return o.has(key) && !o.get(key).isJsonNull() ? o.get(key).getAsString() : "";
    }
}

