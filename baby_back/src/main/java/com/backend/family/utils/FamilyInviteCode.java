package com.backend.family.utils;

import java.security.SecureRandom;

public class FamilyInviteCode {

    private static final String INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int INVITE_CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private FamilyInviteCode() {
    }
    public static String generateInviteCode(){
        StringBuilder code = new StringBuilder();

        for (int i = 0; i < INVITE_CODE_LENGTH; i++) {
            code.append(INVITE_CODE_CHARS.charAt(RANDOM.nextInt(INVITE_CODE_CHARS.length())));
        }

        return code.toString();
    }
}
