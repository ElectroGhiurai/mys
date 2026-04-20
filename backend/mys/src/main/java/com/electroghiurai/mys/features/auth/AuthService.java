package com.electroghiurai.mys.features.auth;

import com.electroghiurai.mys.features.auth.AuthDtos.*;
import com.electroghiurai.mys.features.auth.AuthExceptions.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for authentication (architectural-pattern: pure business layer).
 * No HTTP concerns here — all I/O goes through UserRepository (I/O isolation rule).
 *
 * Security rules applied:
 * - BCrypt via PasswordEncoder (Spring Security default cost ≥ 10, configured to 12)
 * - Duplicate check before insert → 409, not 500
 * - Generic credential error → prevents user enumeration (security-principles)
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService      = jwtService;
    }

    /**
     * Registers a new user. Fails fast if email or username is taken.
     * @return AuthResponse with access token and safe user summary.
     */
    @Transactional
    public TokenPair register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new UserAlreadyExistsException("email", "This email address is already in use.");
        }
        if (userRepository.existsByUsername(req.username())) {
            throw new UserAlreadyExistsException("username", "This username is already taken.");
        }

        User user = new User();
        user.setUsername(req.username());
        user.setEmail(req.email());
        user.setPasswordHash(passwordEncoder.encode(req.password()));

        user = userRepository.save(user);
        return issueTokens(user);
    }

    /**
     * Authenticates an existing user.
     * Uses generic error message to prevent user enumeration.
     * @return TokenPair with access + refresh tokens.
     */
    @Transactional(readOnly = true)
    public TokenPair login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        return issueTokens(user);
    }

    /**
     * Refreshes a session using a refresh token.
     * @return TokenPair with a new access token and a new refresh token.
     */
    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidTokenException();
        }

        try {
            String email = jwtService.validateAndExtractEmail(refreshToken);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(InvalidTokenException::new);
            return issueTokens(user);
        } catch (Exception e) {
            throw new InvalidTokenException();
        }
    }

    // ── Pure helper — no I/O, deterministic output ─────────────────────────

    private TokenPair issueTokens(User user) {
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        UserSummary summary = new UserSummary(
                user.getId().toString(),
                user.getDisplayUsername(),
                user.getEmail()
        );
        return new TokenPair(accessToken, refreshToken, summary);
    }

    /** Internal record — carries both tokens from service to controller. */
    public record TokenPair(String accessToken, String refreshToken, UserSummary user) {}
}
