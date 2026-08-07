package com.backend.babysitter.domain;

public enum BabysitterGrade {

    NEW, POPULAR, VETERAN, TOP;

    public static BabysitterGrade fromPickCount(long pickCount) {

        if (pickCount >= 30) {
            return TOP;
        }

        if (pickCount >= 20) {
            return VETERAN;
        }

        if (pickCount >= 5) {
            return POPULAR;
        }

        return NEW;
    }
}
