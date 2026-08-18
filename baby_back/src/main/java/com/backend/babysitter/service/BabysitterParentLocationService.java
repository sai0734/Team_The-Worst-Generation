package com.backend.babysitter.service;

import com.backend.babysitter.domain.BabysitterParentLocation;

public interface BabysitterParentLocationService {

    BabysitterParentLocation get(String email);

    void save(String email, String region, Double latitude, Double longitude);
}
