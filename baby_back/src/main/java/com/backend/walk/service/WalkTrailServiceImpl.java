package com.backend.walk.service;

import com.backend.walk.dto.WalkTrailDTO;

import java.util.List;

public interface WalkTrailServiceImpl {

    List<WalkTrailDTO> getNearby(double lat, double lng, double radiusKm, int limit);

    Long register(WalkTrailDTO dto);
}