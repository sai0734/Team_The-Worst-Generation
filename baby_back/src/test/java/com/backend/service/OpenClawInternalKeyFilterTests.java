package com.backend.service;

import com.backend.global.security.filter.OpenClawInternalKeyFilter;
import jakarta.servlet.FilterChain;
import lombok.extern.log4j.Log4j2;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Log4j2
class OpenClawInternalKeyFilterTests {

    private static final String INTERNAL_KEY =
            "test-internal-key-1234567890";

    private static final String OPENCLAW_PATH =
            "/api/openclaw/message/result";

    @Test
    void allowRequestWithValidInternalKey() throws Exception {
        OpenClawInternalKeyFilter filter =
                new OpenClawInternalKeyFilter(INTERNAL_KEY);

        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", OPENCLAW_PATH);

        request.addHeader(
                OpenClawInternalKeyFilter.INTERNAL_KEY_HEADER,
                INTERNAL_KEY
        );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        log.info(
                "Valid key test: status={}, path={}",
                response.getStatus(),
                request.getRequestURI()
        );

        assertEquals(
                HttpStatus.OK.value(),
                response.getStatus()
        );

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void rejectRequestWithoutInternalKey() throws Exception {
        OpenClawInternalKeyFilter filter =
                new OpenClawInternalKeyFilter(INTERNAL_KEY);

        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", OPENCLAW_PATH);

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        log.info(
                "Missing key test: status={}, body={}",
                response.getStatus(),
                response.getContentAsString()
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED.value(),
                response.getStatus()
        );

        assertTrue(
                response.getContentAsString()
                        .contains("INVALID_OPENCLAW_INTERNAL_KEY")
        );

        verifyNoInteractions(filterChain);
    }

    @Test
    void rejectRequestWithInvalidInternalKey() throws Exception {
        OpenClawInternalKeyFilter filter =
                new OpenClawInternalKeyFilter(INTERNAL_KEY);

        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", OPENCLAW_PATH);

        request.addHeader(
                OpenClawInternalKeyFilter.INTERNAL_KEY_HEADER,
                "wrong-key"
        );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        log.info(
                "Invalid key test: status={}, body={}",
                response.getStatus(),
                response.getContentAsString()
        );

        assertEquals(
                HttpStatus.UNAUTHORIZED.value(),
                response.getStatus()
        );

        verifyNoInteractions(filterChain);
    }

    @Test
    void returnServiceUnavailableWhenServerKeyIsMissing()
            throws Exception {

        OpenClawInternalKeyFilter filter =
                new OpenClawInternalKeyFilter("");

        MockHttpServletRequest request =
                new MockHttpServletRequest("POST", OPENCLAW_PATH);

        request.addHeader(
                OpenClawInternalKeyFilter.INTERNAL_KEY_HEADER,
                INTERNAL_KEY
        );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        log.info(
                "Missing server key test: status={}, body={}",
                response.getStatus(),
                response.getContentAsString()
        );

        assertEquals(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                response.getStatus()
        );

        assertTrue(
                response.getContentAsString()
                        .contains(
                                "OPENCLAW_INTERNAL_KEY_NOT_CONFIGURED"
                        )
        );

        verifyNoInteractions(filterChain);
    }

    @Test
    void ignoreRequestsOutsideOpenClawPath() throws Exception {
        OpenClawInternalKeyFilter filter =
                new OpenClawInternalKeyFilter(INTERNAL_KEY);

        MockHttpServletRequest request =
                new MockHttpServletRequest(
                        "POST",
                        "/api/hospitals/search"
                );

        MockHttpServletResponse response =
                new MockHttpServletResponse();

        FilterChain filterChain = mock(FilterChain.class);

        filter.doFilter(request, response, filterChain);

        log.info(
                "Non-OpenClaw path test: status={}, path={}",
                response.getStatus(),
                request.getRequestURI()
        );

        verify(filterChain).doFilter(request, response);
    }
}