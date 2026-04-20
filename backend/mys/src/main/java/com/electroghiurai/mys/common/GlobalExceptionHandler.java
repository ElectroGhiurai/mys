package com.electroghiurai.mys.common;

import com.electroghiurai.mys.features.auth.AuthExceptions.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Map;

/**
 * Centralised error handler — maps domain exceptions to the API error envelope
 * defined in api-design-principles.md.
 *
 * Error response format:
 * {
 *   "status": "error",
 *   "code": 4xx,
 *   "error": { "code": "UPPER_SNAKE", "message": "...", "details": { "field": "...", "reason": "..." } }
 * }
 *
 * Rules applied (error-handling-principles):
 * - No stack traces in responses
 * - Sanitized user-facing messages
 * - Business errors ≠ technical errors ≠ validation errors
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    /** 400 — Bean Validation failures (field-level). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        FieldError first = ex.getBindingResult().getFieldErrors().stream().findFirst().orElse(null);
        String field   = first != null ? first.getField()           : null;
        String message = first != null ? first.getDefaultMessage()  : "Validation failed.";

        return errorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, field);
    }

    /** 409 Conflict — duplicate email or username. */
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(UserAlreadyExistsException ex) {
        return errorResponse(HttpStatus.CONFLICT, "DUPLICATE_FIELD", ex.getMessage(), ex.getField());
    }

    /** 401 Unauthorized — wrong credentials. */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return errorResponse(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", ex.getMessage(), null);
    }

    /** 401 Unauthorized — bad refresh token. */
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidToken(InvalidTokenException ex) {
        return errorResponse(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN", ex.getMessage(), null);
    }

    /** 404 — Route not found. Let Spring handle it cleanly instead of falling to the 500 catch-all. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException ex) {
        return errorResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", "The requested resource was not found.", null);
    }
    /** 500 — Catch-all: log internally, return generic message (no info leakage). */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "SERVER_ERROR",
                "An unexpected error occurred. Please try again later.", null);
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> errorResponse(
            HttpStatus status, String code, String message, String field) {

        var details = field != null ? Map.of("field", field, "reason", message) : null;
        var error   = details != null
                ? Map.of("code", code, "message", message, "details", details)
                : Map.of("code", code, "message", message);

        var body = Map.of(
                "status", "error",
                "code",   status.value(),
                "error",  error
        );

        return ResponseEntity.status(status).body(body);
    }
}
