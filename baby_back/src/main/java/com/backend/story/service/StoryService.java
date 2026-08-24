package com.backend.story.service;

import com.backend.story.dto.StoryAudioDTO;
import com.backend.story.dto.StoryGenerateRequestDTO;
import com.backend.story.dto.StoryGenerateResponseDTO;
import com.backend.story.dto.StoryTtsStatusDTO;

public interface StoryService {

    StoryGenerateResponseDTO generate(StoryGenerateRequestDTO requestDTO);

    StoryAudioDTO synthesize(String text);

    StoryTtsStatusDTO getTtsStatus();
}
