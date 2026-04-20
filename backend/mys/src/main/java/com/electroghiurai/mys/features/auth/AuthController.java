package com.electroghiurai.mys.features.auth;

import com.electroghiurai.mys.features.auth.AuthDtos.*;
import com.electroghiurai.mys.features.auth.AuthService.TokenPair;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * HTTP layer for authentication endpoints.
 * Concerns: routing, request binding, cookie setting, response mapping.
 * Business logic stays in AuthService (SRP / separation of concerns).
 *
 * Endpoints:
 * POST /api/v1/auth/register
 * POST /api/v1/auth/login
 *
 * Token delivery (security-principles):
 * - Access token → JSON body (short-lived, read by JS)
 * - Refresh token → HttpOnly; Secure; SameSite=Strict cookie (JS cannot touch
 * it)
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final int REFRESH_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Register a new account. */
    @PostMapping("/register")
    public ResponseEntity<Map<String, AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        TokenPair tokens = authService.register(req);
        return buildAuthResponse(tokens, HttpStatus.CREATED);
    }

    /** Login with email + password. */
    @PostMapping("/login")
    public ResponseEntity<Map<String, AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        TokenPair tokens = authService.login(req);
        return buildAuthResponse(tokens, HttpStatus.OK);
    }

    /** Trade refresh cookie for a new access token. */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        TokenPair tokens = authService.refresh(refreshToken);
        return buildAuthResponse(tokens, HttpStatus.OK);
    }

    /** Clear the refresh token cookie on logout. */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        ResponseCookie clearCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .build();
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private ResponseEntity<Map<String, AuthResponse>> buildAuthResponse(TokenPair tokens, HttpStatus status) {
        ResponseCookie refreshCookie = ResponseCookie.from(REFRESH_COOKIE_NAME, tokens.refreshToken())
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path("/api/v1/auth") // only sent to auth endpoints — minimize exposure
                .maxAge(REFRESH_MAX_AGE_SEC)
                .build();

        AuthResponse data = new AuthResponse(tokens.accessToken(), tokens.user());

        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("data", data));
    }
}
