package com.backend.babyInfo.service;

import com.backend.babyInfo.dto.GrowthPercentileDTO;

public interface GrowthPercentileService {

    GrowthPercentileDTO getPercentile(Long babyNo, String email);

}