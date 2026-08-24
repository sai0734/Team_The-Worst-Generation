package com.backend.story;

import com.backend.story.client.StoryAiClient;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.service.StoryServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class StoryServiceTests {

    private final StoryAiClient client = mock(StoryAiClient.class);
    private final StoryServiceImpl service = new StoryServiceImpl(client);

    @Test
    void rejectInvalidBabyAgeBeforeAiCall() {
        StoryGenerateRequestDTO request = new StoryGenerateRequestDTO(
                "서윤",
                121,
                List.of(),
                List.of(),
                "BEDTIME"
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> service.generate(request)
        );
        verifyNoInteractions(client);
    }

    @Test
    void rejectEmptyTtsTextBeforeAiCall() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.synthesize(" ")
        );
        verifyNoInteractions(client);
    }
}
