package com.backend.walk.client;

public record KakaoPlace (

    String name,
    String address,
    double latitude,
    double longitude,
    double distanceM,
    String category
) {}
