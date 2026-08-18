package com.backend.assistant.util;

public final class AssistRegionNames {

    private AssistRegionNames() {
    }

    public static String sido(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        if (s.isBlank()) {
            return "";
        }
        if (s.contains("서울")) return "서울특별시";
        if (s.contains("부산")) return "부산광역시";
        if (s.contains("대구")) return "대구광역시";
        if (s.contains("인천")) return "인천광역시";
        if (s.contains("광주") && !s.contains("경기")) return "광주광역시";
        if (s.contains("대전")) return "대전광역시";
        if (s.contains("울산")) return "울산광역시";
        if (s.contains("세종")) return "세종특별자치시";
        if (s.contains("경기")) return "경기도";
        if (s.contains("강원")) return "강원특별자치도";
        if (s.contains("충북") || s.contains("충청북")) return "충청북도";
        if (s.contains("충남") || s.contains("충청남")) return "충청남도";
        if (s.contains("전북") || s.contains("전라북")) return "전북특별자치도";
        if (s.contains("전남") || s.contains("전라남")) return "전라남도";
        if (s.contains("경북") || s.contains("경상북")) return "경상북도";
        if (s.contains("경남") || s.contains("경상남")) return "경상남도";
        if (s.contains("제주")) return "제주특별자치도";
        return s;
    }

    public static String sigungu(String raw) {
        if (raw == null) {
            return "";
        }
        String s = raw.trim();
        if (s.isBlank()) {
            return "";
        }
        if (s.endsWith("시") || s.endsWith("군") || s.endsWith("구")) {
            return s;
        }
        String[] cities = {
                "수원", "성남", "고양", "용인", "창원", "청주", "전주", "천안",
                "포항", "김해", "제주", "세종", "안양", "부천", "남양주", "화성"
        };
        for (String city : cities) {
            if (s.equals(city) || s.startsWith(city)) {
                return city + "시";
            }
        }
        return s + "구";
    }
}
