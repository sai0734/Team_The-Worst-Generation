package com.backend.assistant.service;

public interface AssistBatchService {
    void refreshAll();
    void refreshEmail(String email);
}
