package com.backend.assistant.scheduler;

import com.backend.global.ai.RagClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AssistRecommendSchedulerTests {

    private RagClient ragClient;
    private AssistRecommendScheduler scheduler;

    @BeforeEach
    void setUp() {
        ragClient = mock(RagClient.class);
        scheduler = new AssistRecommendScheduler(ragClient);
    }

    @Test
    void completesSuccessfulReindex() {
        when(ragClient.reindex()).thenReturn(
                new RagClient.ReindexResult(
                        true, false, "완료",
                        100, 10, 5, 85, 2,
                        "2026-08-26T03:30:00+09:00",
                        "2026-08-26T03:35:00+09:00"
                )
        );

        scheduler.refreshDaily();

        verify(ragClient).reindex();
    }

    @Test
    void stopsAfterFailedReindex() {
        when(ragClient.reindex()).thenReturn(
                new RagClient.ReindexResult(
                        false, false, "API 오류",
                        0, 0, 0, 0, 0,
                        null, null
                )
        );

        scheduler.refreshDaily();

        verify(ragClient).reindex();
    }
}
