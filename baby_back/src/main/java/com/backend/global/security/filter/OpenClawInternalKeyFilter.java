package com.backend.global.security.filter;

import com.google.gson.Gson;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@Log4j2
public class OpenClawInternalKeyFilter
        extends OncePerRequestFilter {

    public static final String INTERNAL_KEY_HEADER =
            "X-OpenClaw-Internal-Key";

    private static final String OPENCLAW_PATH =
            "/api/openclaw/**";

    private final String internalKey;
    private final AntPathMatcher pathMatcher =
            new AntPathMatcher();

    public OpenClawInternalKeyFilter(String internalKey) {
        this.internalKey = internalKey;
    }

    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request
    ) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }

        return !pathMatcher.match(
                OPENCLAW_PATH,
                request.getRequestURI()
        );
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (internalKey == null || internalKey.isBlank()) {
            log.error(
                    "OpenClaw internal key is not configured"
            );

            writeError(
                    response,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "OPENCLAW_INTERNAL_KEY_NOT_CONFIGURED"
            );
            return;
        }

        String requestKey =
                request.getHeader(INTERNAL_KEY_HEADER);

        if (!matchesInternalKey(requestKey)) {
            log.warn(
                    "Rejected unauthorized OpenClaw request: "
                            + "method={}, path={}",
                    request.getMethod(),
                    request.getRequestURI()
            );

            writeError(
                    response,
                    HttpStatus.UNAUTHORIZED,
                    "INVALID_OPENCLAW_INTERNAL_KEY"
            );
            return;
        }

        log.info(
                "Accepted OpenClaw internal request: "
                        + "method={}, path={}",
                request.getMethod(),
                request.getRequestURI()
        );

        filterChain.doFilter(request, response);
    }

    private boolean matchesInternalKey(String requestKey) {
        if (requestKey == null || requestKey.isBlank()) {
            return false;
        }

        byte[] expected =
                internalKey.getBytes(StandardCharsets.UTF_8);

        byte[] actual =
                requestKey.getBytes(StandardCharsets.UTF_8);

        return MessageDigest.isEqual(expected, actual);
    }

    private void writeError(
            HttpServletResponse response,
            HttpStatus status,
            String error
    ) throws IOException {

        response.setStatus(status.value());
        response.setContentType(
                "application/json; charset=UTF-8"
        );

        String body = new Gson().toJson(
                Map.of("error", error)
        );

        response.getWriter().println(body);
    }
}