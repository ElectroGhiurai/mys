package com.electroghiurai.mys.features.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * JWT token operations — generation and validation.
 *
 * Security rules applied (security-principles):
 * - HS256 algorithm (standard, not rolled-from-scratch)
 * - Access token: 15 min lifetime
 * - Refresh token: 7 days lifetime (stored in HttpOnly cookie by controller)
 * - Secret loaded from config, never hardcoded (secrets-management)
 */
@Component
public class JwtService {

    private static final long ACCESS_TOKEN_MS = 15L * 60 * 1000; // 15 minutes
    private static final long REFRESH_TOKEN_MS = 7L * 24 * 60 * 60 * 1000; // 7 days

    private final SecretKey key;

    public JwtService(@Value("${app.jwt.secret}") String secret) {
        // Key must be ≥ 256 bits for HS256
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return buildToken(user.getEmail(), ACCESS_TOKEN_MS);
    }

    public String generateRefreshToken(User user) {
        return buildToken(user.getEmail(), REFRESH_TOKEN_MS);
    }

    /**
     * Returns the subject (email) if the token is valid, throws JwtException
     * otherwise.
     */
    public String validateAndExtractEmail(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private String buildToken(String subject, long expirationMs) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(subject)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }
}
