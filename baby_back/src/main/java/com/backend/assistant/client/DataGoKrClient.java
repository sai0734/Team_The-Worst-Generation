package com.backend.assistant.client;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
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

@Component
@Log4j2
public class DataGoKrClient {

    @Value("${data.go.kr.service-key:}")
    private String servicekey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public JsonObject get(String url, Map<String, String> params) {
        if (servicekey == null || servicekey.isBlank()) {
            throw new IllegalStateException("공공데이터키가 없습니다.");
        }
        try {
            String key = servicekey.trim();
            String encodedKey = key.contains("%") ? key : URLEncoder.encode(key, StandardCharsets.UTF_8);
            StringBuilder qs = new StringBuilder();
            qs.append("serviceKey=").append(encodedKey);
            for (var e : params.entrySet()) {
                if (e.getValue() == null || e.getValue().isBlank()) continue;
                qs.append("&").append(e.getKey()).append("=")
                        .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
            }
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url + "?" + qs))
                    .header("User-Agent", "Mozilla/5.0")
                    .timeout(Duration.ofSeconds(20))
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) {
                throw new IllegalStateException("data.go.kr HTTP" + res.statusCode());
            }
            String body = res.body() == null ? "" : res.body().trim();
            if (body.isBlank()) {
                throw new IllegalStateException("공공 API 빈 응답");
            }
            if (body.startsWith("<")) {
                return xmlToJson(body);
            }
            return JsonParser.parseString(body).getAsJsonObject();
        } catch (Exception e) {
            log.error("공공데이터 호출 실패: {}", url, e);
            throw new IllegalStateException("공공 API호출 실패", e);
        }
    }

    public List<JsonObject> items(JsonObject root) {
        if (root == null) {
            return List.of();
        }
        logApiError(root);
        List<JsonObject> out = collect(root, "servList");
        if (!out.isEmpty()) {
            return out;
        }
        if (root.has("wantedList") && root.get("wantedList").isJsonObject()) {
            out = collect(root.getAsJsonObject("wantedList"), "servList");
            if (!out.isEmpty()) {
                return out;
            }
        }
        JsonElement body = root.get("response") != null && root.get("response").isJsonObject()
                ? root.getAsJsonObject("response").get("body")
                : root.get("body");
        if (body != null && body.isJsonObject()) {
            JsonElement items = body.getAsJsonObject().get("items");
            if (items != null && items.isJsonObject() && items.getAsJsonObject().has("item")) {
                out = asObjectList(items.getAsJsonObject().get("item"));
                if (!out.isEmpty()) {
                    return out;
                }
            }
            out = asObjectList(items);
            if (!out.isEmpty() && !out.get(0).has("item")) {
                return out;
            }
        }
        JsonElement wanted = root.get("wantedList");
        if (wanted != null && wanted.isJsonObject()) {
            return asObjectList(wanted.getAsJsonObject().get("servList"));
        }
        return List.of();
    }

    public static Map<String, String> page(int page, int rows) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("pageNo", String.valueOf(page));
        m.put("numOfRows", String.valueOf(rows));
        m.put("type", "json");
        return m;
    }

    private static List<JsonObject> collect(JsonObject obj, String key) {
        if (obj == null || !obj.has(key)) {
            return List.of();
        }
        return asObjectList(obj.get(key));
    }

    private static List<JsonObject> asObjectList(JsonElement el) {
        List<JsonObject> out = new ArrayList<>();
        if (el == null || el.isJsonNull()) {
            return out;
        }
        if (el.isJsonArray()) {
            JsonArray arr = el.getAsJsonArray();
            for (JsonElement item : arr) {
                if (item.isJsonObject()) {
                    out.add(item.getAsJsonObject());
                }
            }
        } else if (el.isJsonObject()) {
            out.add(el.getAsJsonObject());
        }
        return out;
    }

    private static void logApiError(JsonObject root) {
        try {
            JsonObject header = null;
            if (root.has("cmmMsgHeader") && root.get("cmmMsgHeader").isJsonObject()) {
                header = root.getAsJsonObject("cmmMsgHeader");
            } else if (root.has("response") && root.get("response").isJsonObject()) {
                JsonObject resp = root.getAsJsonObject("response");
                if (resp.has("header") && resp.get("header").isJsonObject()) {
                    header = resp.getAsJsonObject("header");
                }
            }
            if (header == null) {
                return;
            }
            String code = text(header, "resultCode", "returnReasonCode");
            String msg = text(header, "resultMsg", "errMsg", "returnAuthMsg");
            if (!code.isBlank() && !"00".equals(code) && !"0".equals(code) && !"NORMAL_CODE".equals(code)) {
                log.warn("공공 API 오류 code={} msg={}", code, msg);
            }
        } catch (Exception ignored) {
            // 오류 로그 실패는 목록 파싱을 막지 않는다
        }
    }

    private static String text(JsonObject o, String... keys) {
        for (String key : keys) {
            if (o.has(key) && !o.get(key).isJsonNull()) {
                String v = o.get(key).getAsString();
                if (v != null && !v.isBlank()) {
                    return v;
                }
            }
        }
        return "";
    }

    private static JsonObject xmlToJson(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        Document doc = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));
        JsonElement converted = nodeToJson(doc.getDocumentElement());
        if (converted.isJsonObject()) {
            return converted.getAsJsonObject();
        }
        JsonObject wrap = new JsonObject();
        wrap.add("value", converted);
        return wrap;
    }

    private static JsonElement nodeToJson(Element el) {
        Map<String, List<JsonElement>> kids = new LinkedHashMap<>();
        NodeList nodes = el.getChildNodes();
        for (int i = 0; i < nodes.getLength(); i++) {
            Node n = nodes.item(i);
            if (n.getNodeType() == Node.ELEMENT_NODE) {
                Element child = (Element) n;
                kids.computeIfAbsent(child.getTagName(), k -> new ArrayList<>()).add(nodeToJson(child));
            }
        }
        if (kids.isEmpty()) {
            String text = el.getTextContent() == null ? "" : el.getTextContent().trim();
            com.google.gson.JsonPrimitive p = new com.google.gson.JsonPrimitive(text);
            return p;
        }
        JsonObject obj = new JsonObject();
        for (var e : kids.entrySet()) {
            List<JsonElement> vals = e.getValue();
            if (vals.size() == 1) {
                obj.add(e.getKey(), vals.get(0));
            } else {
                JsonArray arr = new JsonArray();
                vals.forEach(arr::add);
                obj.add(e.getKey(), arr);
            }
        }
        return obj;
    }
}
