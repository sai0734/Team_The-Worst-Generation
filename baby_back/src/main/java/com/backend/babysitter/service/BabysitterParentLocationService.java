package com.backend.babysitter.service;

public interface BabysitterParentLocationService {

    String getRegion(String email);

    void saveRegion(String email, String region);
}
