package com.backend.story.exception;

public class StoryAiException extends RuntimeException {

    public StoryAiException(String message) {
        super(message);
    }

    public StoryAiException(String message, Throwable cause) {
        super(message, cause);
    }
}
