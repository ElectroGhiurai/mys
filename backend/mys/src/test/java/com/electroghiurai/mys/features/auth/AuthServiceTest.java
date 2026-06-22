package com.electroghiurai.mys.features.auth;

import com.electroghiurai.mys.features.auth.AuthDtos.*;
import com.electroghiurai.mys.features.auth.AuthExceptions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    void register_happyPath_returnsTokenPair() {
        // Arrange
        RegisterRequest req = new RegisterRequest("testuser", "test@test.com", "password123");
        when(userRepository.existsByEmail(req.email())).thenReturn(false);
        when(userRepository.existsByUsername(req.username())).thenReturn(false);

        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setUsername(req.username());
        savedUser.setEmail(req.email());
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(passwordEncoder.encode(req.password())).thenReturn("hashed_password");
        when(jwtService.generateAccessToken(savedUser)).thenReturn("access_token");
        when(jwtService.generateRefreshToken(savedUser)).thenReturn("refresh_token");

        // Act
        AuthService.TokenPair result = authService.register(req);

        // Assert
        assertNotNull(result);
        assertEquals("access_token", result.accessToken());
        assertEquals("refresh_token", result.refreshToken());
        assertEquals(savedUser.getId().toString(), result.user().id());
        assertEquals("testuser", result.user().username());
        assertEquals("test@test.com", result.user().email());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsException() {
        // Arrange
        RegisterRequest req = new RegisterRequest("testuser", "test@test.com", "password123");
        when(userRepository.existsByEmail(req.email())).thenReturn(true);

        // Act & Assert
        UserAlreadyExistsException ex = assertThrows(UserAlreadyExistsException.class, () -> authService.register(req));
        assertEquals("email", ex.getField());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_duplicateUsername_throwsException() {
        // Arrange
        RegisterRequest req = new RegisterRequest("testuser", "test@test.com", "password123");
        when(userRepository.existsByEmail(req.email())).thenReturn(false);
        when(userRepository.existsByUsername(req.username())).thenReturn(true);

        // Act & Assert
        UserAlreadyExistsException ex = assertThrows(UserAlreadyExistsException.class, () -> authService.register(req));
        assertEquals("username", ex.getField());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_happyPath_returnsTokenPair() {
        // Arrange
        LoginRequest req = new LoginRequest("test@test.com", "password123");
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(req.email());
        user.setUsername("testuser");
        user.setPasswordHash("hashed_password");

        when(userRepository.findByEmail(req.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(req.password(), user.getPassword())).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access_token");
        when(jwtService.generateRefreshToken(user)).thenReturn("refresh_token");

        // Act
        AuthService.TokenPair result = authService.login(req);

        // Assert
        assertNotNull(result);
        assertEquals("access_token", result.accessToken());
        assertEquals("refresh_token", result.refreshToken());
    }

    @Test
    void login_wrongPassword_throwsException() {
        // Arrange
        LoginRequest req = new LoginRequest("test@test.com", "password123");
        User user = new User();
        user.setPasswordHash("hashed_password");

        when(userRepository.findByEmail(req.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(req.password(), user.getPassword())).thenReturn(false);

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void login_userNotFound_throwsException() {
        // Arrange
        LoginRequest req = new LoginRequest("test@test.com", "password123");
        when(userRepository.findByEmail(req.email())).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void refresh_happyPath_returnsNewTokenPair() {
        // Arrange
        String refreshToken = "valid_refresh_token";
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@test.com");
        user.setUsername("testuser");

        when(jwtService.validateAndExtractEmail(refreshToken)).thenReturn("test@test.com");
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user)).thenReturn("new_access_token");
        when(jwtService.generateRefreshToken(user)).thenReturn("new_refresh_token");

        // Act
        AuthService.TokenPair result = authService.refresh(refreshToken);

        // Assert
        assertNotNull(result);
        assertEquals("new_access_token", result.accessToken());
        assertEquals("new_refresh_token", result.refreshToken());
    }

    @Test
    void refresh_nullToken_throwsException() {
        // Act & Assert
        assertThrows(InvalidTokenException.class, () -> authService.refresh(null));
        assertThrows(InvalidTokenException.class, () -> authService.refresh(""));
    }

    @Test
    void refresh_invalidToken_throwsException() {
        // Arrange
        String refreshToken = "invalid_token";
        when(jwtService.validateAndExtractEmail(refreshToken)).thenThrow(new RuntimeException("invalid token signature"));

        // Act & Assert
        assertThrows(InvalidTokenException.class, () -> authService.refresh(refreshToken));
    }
}
