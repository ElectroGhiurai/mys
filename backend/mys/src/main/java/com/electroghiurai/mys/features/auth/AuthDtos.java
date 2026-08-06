package com.electroghiurai.mys.features.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Inbound DTOs — validated at the HTTP boundary (fail fast,
 * security-principles).
 * These are records (immutable, concise — idiomatic Java 17+).
 */
public final class AuthDtos {

        private AuthDtos() {
        }

        /**
         * POST /api/v1/auth/register
         * Allowlist validation: username allows only letters, numbers, underscores.
         */
        public record RegisterRequest(

                        @NotBlank(message = "Username is required") @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters") @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores") String username,

                        @NotBlank(message = "Email is required") @Email(message = "Please provide a valid email address") @Size(max = 255) String email,

                        @NotBlank(message = "Password is required") @Size(min = 8, message = "Password must be at least 8 characters") String password

        ) {
        }

        /**
         * POST /api/v1/auth/login
         */
        public record LoginRequest(

                        @NotBlank(message = "Email is required") @Email(message = "Please provide a valid email address") String email,

                        @NotBlank(message = "Password is required") String password

        ) {
        }

        /**
         * Outbound: returned on successful login or register.
         * Only the short-lived access token is in the body.
         * The refresh token is sent as an HttpOnly cookie by the controller.
         */
        public record AuthResponse(String accessToken, UserSummary user) {
        }

        /** Safe public user data — never include passwordHash. */
        public record UserSummary(String id, String username, String email, boolean fitnessProfileCompleted) {
        }
}
