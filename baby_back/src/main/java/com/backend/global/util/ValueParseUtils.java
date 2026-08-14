package com.backend.global.util;

public final class ValueParseUtils {

    private ValueParseUtils() {
    }

    public static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static Integer toInteger(String value) {
        try {
            return value == null ? null : Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Double toDouble(String value) {
        try {
            return value == null ? null : Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public static Boolean toBooleanYn(String value) {
        return value == null ? null : "Y".equalsIgnoreCase(value);
    }
}
