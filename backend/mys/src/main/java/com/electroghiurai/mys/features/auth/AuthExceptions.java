package com.electroghiurai.mys.features.auth;

/**
 * Typed exceptions for business rule violations in the auth domain.
 * Separate types per error-handling-principles: business ≠ technical ≠ security errors.
 * These are NOT RuntimeException subclasses that leak stack traces — they carry
 * only user-safe messages.
 */
public final class AuthExceptions {

    private AuthExceptions() {}

    /** 409 Conflict — email or username already taken. */
    public static class UserAlreadyExistsException extends RuntimeException {
        private final String field;

        public UserAlreadyExistsException(String field, String message) {
            super(message);
            this.field = field;
        }

        public String getField() { return field; }
    }

    /** 401 Unauthorized — bad credentials. Generic message to prevent user enumeration. */
    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException() {
            super("Invalid email or password.");
        }
    }

    /** 401 Unauthorized — invalid or expired token. */
    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException() {
            super("Session expired. Please log in again.");
        }
    }
}
