package com.backend.hospital.emergency.client;

import static com.backend.global.util.ValueParseUtils.toBooleanYn;
import static com.backend.global.util.ValueParseUtils.toDouble;
import static com.backend.global.util.ValueParseUtils.toInteger;
import static com.backend.global.util.XmlUtils.elements;
import static com.backend.global.util.XmlUtils.firstText;
import static com.backend.global.util.XmlUtils.parse;
import static com.backend.global.util.XmlUtils.text;

import com.backend.hospital.emergency.dto.EmergencyRoomBedStatusDTO;
import com.backend.hospital.emergency.dto.EmergencyRoomLocationDTO;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Log4j2
public class EmergencyApiClient {

    // 응급의료기관 위치정보를 경도/위도별 반경내 정보를 조회할 수 있다. - 사이트 공식 설명
    private static final String LOCATION_PATH = "/getEgytLcinfoInqire";
    // 응급실이 보유하고 있는 가용병상 정보현황을 시도/시군구별로 조회할 수 있다. - 사이트 공식 설명
    private static final String BED_STATUS_PATH = "/getEmrrmRltmUsefulSckbdInfoInqire";

    // api, end point
    @Value("${HOSPITAL_ER_BASE_URL:https://apis.data.go.kr/B552657/ErmctInfoInqireService}")
    private String baseUrl;

    @Value("${HOSPITAL_ER_API_KEY:}")
    private String serviceKey;
    //

    // JDK 기본 HttpClient를 재사용한다. 매 요청마다 새로 만들지 않도록 필드로 둔다.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // 사용자 위치 기준 으로 주변 응급 의료 기관을 조회하는 함수
    public List<EmergencyRoomLocationDTO> searchLocations(
            double longitude,
            double latitude,
            int pageNo,
            int numOfRows
    ) {
        // WGS84_LON, WGS84_LAT로 파라미터를 요구한다.
        Map<String, String> params = new LinkedHashMap<>();
        params.put("WGS84_LON", String.valueOf(longitude));
        params.put("WGS84_LAT", String.valueOf(latitude));
        params.put("pageNo", String.valueOf(pageNo));
        params.put("numOfRows", String.valueOf(numOfRows));

        //  XML 응답의 <item>들을 위치정보 DTO로 변환
        return parseItems(call(LOCATION_PATH, params)).stream()
                .map(this::toLocationDTO)
                .toList();
    }

    // 응급실 실기간 가용병상정보를 조회하는 함수
    public List<EmergencyRoomBedStatusDTO> searchBedStatuses(
            String stage1,
            String stage2,
            int pageNo,
            int numOfRows
    ) {
        // 지역명을 STAGE1, STAGE2 파라미터로 받는다.
        Map<String, String> params = new LinkedHashMap<>();
        params.put("STAGE1", stage1);
        params.put("STAGE2", stage2);
        params.put("pageNo", String.valueOf(pageNo));
        params.put("numOfRows", String.valueOf(numOfRows));

        // 여기도 XML응답을 DTO로 변환
        return parseItems(call(BED_STATUS_PATH, params)).stream()
                .map(this::toBedStatusDTO)
                .toList();
    }

    // 위치 기준으로 받아온거를 DTO로 바꿔주는 함수
    private EmergencyRoomLocationDTO toLocationDTO(Element item) {
        return EmergencyRoomLocationDTO.builder()
                .hpid(text(item, "hpid"))
                .dutyName(text(item, "dutyName"))
                .dutyAddr(text(item, "dutyAddr"))
                .dutyDivName(text(item, "dutyDivName"))
                .dutyTel1(text(item, "dutyTel1"))
                .latitude(toDouble(text(item, "latitude")))
                .longitude(toDouble(text(item, "longitude")))
                .distance(toDouble(text(item, "distance")))
                .startTime(text(item, "startTime"))
                .endTime(text(item, "endTime"))
                .build();
    }

    // 응급실 실기간 가용병상 정보 DTO로 바꿔주는 함수
    private EmergencyRoomBedStatusDTO toBedStatusDTO(Element item) {
        return EmergencyRoomBedStatusDTO.builder()
                .hpid(text(item, "hpid"))
                .dutyName(text(item, "dutyName"))
                .emergencyPhone(text(item, "dutyTel3"))
                .availableEmergencyBeds(toInteger(text(item, "hvec")))
                .operatingRoomAvailable(toInteger(text(item, "hvoc")))
                .pediatricVentiAvailable(toBooleanYn(text(item, "hv10")))
                .incubatorAvailable(toBooleanYn(text(item, "hv11")))
                .ctAvailable(toBooleanYn(text(item, "hvctayn")))
                .mriAvailable(toBooleanYn(text(item, "hvmriayn")))
                .ventilatorAvailable(toBooleanYn(text(item, "hvventiayn")))
                .updatedAt(text(item, "hvidate"))
                .build();
    }

    // 공공데이터 API를 GET방식으로 호출하고,
    private String call(String path, Map<String, String> params) {
        // api 키 없으면 안되게 하고
        if (serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalStateException("HOSPITAL_ER_API_KEY is empty.");
        }

        // 나머지 조회 조건은 params로 받아서 쿼리 스트링으로 만들기 ex) 주소~?#1=@@@&#2=@@@ 식으로
        String url = normalizedBaseUrl() + path + "?" + toQueryString(params);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalStateException("Hospital ER API HTTP error: " + response.statusCode());
            }

            return response.body();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Hospital ER API call interrupted: {}", e.getMessage());
            throw new IllegalStateException("Hospital ER API call interrupted.", e);

        } catch (IOException e) {
            log.error("Hospital ER API call failed: {}", e.getMessage());
            throw new IllegalStateException("Hospital ER API call failed.", e);
        }
    }

    // 위에 쿼리스트링에 넣을수 있게 바꿔주는 부분
    private String toQueryString(Map<String, String> params) {
        StringBuilder query = new StringBuilder("serviceKey=").append(encode(serviceKey));

        params.forEach((key, value) ->
                                                            // 여기서 인코딩한번
                query.append("&").append(key).append("=").append(encode(value))
        );

        return query.toString();
    }

    // <item> 목록 추출해오기.
    // 실패하면 예외를 던지고, 성공하면 목록을 ELememt 목록으로 반환
    private List<Element> parseItems(String xml) {
        Document document = parse(xml);
        validateResult(document);
        return elements(document, "item");
    }

    // 이건 보안용 설정
    // 외부 API에서 XML파서는 XXE를 공격을 할 수있다.
    // 그래서 DOCTYPE과 외부 엔티티 해석을 막는다
    private DocumentBuilderFactory secureDocumentBuilderFactory() throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setExpandEntityReferences(false);
        return factory;
    }

    // API 응답 코드 정상인지 확인
    private void validateResult(Document document) {
        String resultCode = firstText(document, "resultCode");

        if (resultCode != null && !"00".equals(resultCode)) {
            throw new IllegalStateException(
                    "Hospital ER API error: " + resultCode + " / " + firstText(document, "resultMsg")
            );
        }
    }

    // 기본 주소 / 단순제거용(path와 합칠 때 이중 // 안나오게
    private String normalizedBaseUrl() {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
