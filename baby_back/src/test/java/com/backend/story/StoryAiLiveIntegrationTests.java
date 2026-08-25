package com.backend.story;

import com.backend.story.client.StoryAiClient;
import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsRequestDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@EnabledIfEnvironmentVariable(
        named = "STORY_AI_LIVE_TEST",
        matches = "true"
)
class StoryAiLiveIntegrationTests {

    @Test
    void generateStoryAndSynthesizeWavThroughPythonServer() {
        StoryAiClient client = new StoryAiClient(
                new ObjectMapper().findAndRegisterModules()
        );
        ReflectionTestUtils.setField(
                client,
                "baseUrl",
                System.getenv().getOrDefault(
                        "STORY_AI_TEST_BASE_URL",
                        "http://127.0.0.1:5000"
                )
        );

        StoryGenerateResponseDTO story = client.generate(
                new StoryGenerateRequestDTO(
                        "서윤",
                        36,
                        List.of("토끼", "우주"),
                        List.of("분홍 인형"),
                        "BEDTIME"
                )
        );
        StoryAudioDTO audio = client.synthesize(
                new StoryTtsRequestDTO(story.content())
        );

        assertEquals("LLM", story.generationMode());
        assertTrue(story.characterCount() >= 1720);
        assertEquals(4, story.sceneCount());
        assertEquals(
                "RIFF",
                new String(
                        audio.content(),
                        0,
                        4,
                        StandardCharsets.US_ASCII
                )
        );
        assertTrue(audio.content().length > 44);
    }
}
