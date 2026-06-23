package com.electroghiurai.mys.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.electroghiurai.mys.features.auth.User;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to automatically log entry, completion, latency, and failure context for all operations.
 * Manages the MDC (Mapped Diagnostic Context) lifecycle for correlationId and user tracking.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // 1. Generate or extract correlation ID
        String correlationId = request.getHeader("X-Correlation-ID");
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        MDC.put("correlationId", correlationId);

        // 2. Identify operation
        String method = request.getMethod();
        String path = request.getRequestURI();
        String operation = method + " " + path;
        MDC.put("operation", operation);

        log.info("operation_start: operation={} method={} path={} correlationId={}", operation, method, path, correlationId);

        try {
            filterChain.doFilter(request, response);

            // 3. Extract authenticated user details if present
            var auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = "anonymous";
            if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User user) {
                userId = user.getId().toString();
                MDC.put("userId", userId);
            }

            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            if (status >= 400) {
                log.warn("operation_failure: operation={} status={} duration={}ms correlationId={} userId={}",
                        operation, status, duration, correlationId, userId);
            } else {
                log.info("operation_success: operation={} status={} duration={}ms correlationId={} userId={}",
                        operation, status, duration, correlationId, userId);
            }
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("operation_failure: operation={} duration={}ms correlationId={}",
                    operation, duration, correlationId, e);
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
