package com.backend.quest.service;

public interface PointService {
    int getPoint (String email);
    void add (String email, int amount, String reason, Long refId);
}
