package com.electroghiurai.mys.features.auth;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Persistent user entity.
 * Implements UserDetails so Spring Security can load it directly.
 *
 * Schema rules (database-design-principles):
 *  - UUID primary key
 *  - snake_case column names
 *  - created_at / updated_at on every table
 */
@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_users_email",    columnNames = "email"),
        @UniqueConstraint(name = "uq_users_username", columnNames = "username")
    }
)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "username", nullable = false, length = 30)
    private String username;

    @Column(name = "email",    nullable = false, length = 255)
    private String email;

    /** BCrypt-hashed password — never store plain text (security-principles). */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = Instant.now();
    }

    // ── UserDetails ────────────────────────────────────────────────────────

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(); // roles added later when needed (YAGNI)
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email; // Spring Security uses email as the principal
    }

    @Override
    public boolean isAccountNonExpired()  { return true; }
    @Override
    public boolean isAccountNonLocked()   { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled()            { return true; }

    // ── Getters / setters ──────────────────────────────────────────────────

    public UUID getId()             { return id; }
    public String getDisplayUsername() { return username; }
    public String getEmail()        { return email; }

    public void setUsername(String username)     { this.username = username; }
    public void setEmail(String email)           { this.email = email; }
    public void setPasswordHash(String hash)     { this.passwordHash = hash; }
}
