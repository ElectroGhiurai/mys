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

    @Column(name = "calorie_goal", nullable = false)
    private Double calorieGoal = 2000.0;

    @Column(name = "protein_goal", nullable = false)
    private Double proteinGoal = 130.0;

    @Column(name = "carb_goal", nullable = false)
    private Double carbGoal = 220.0;

    @Column(name = "fat_goal", nullable = false)
    private Double fatGoal = 70.0;

    @Column(name = "starting_weight_kg", nullable = true)
    private Double startingWeightKg;

    @Column(name = "target_weight_kg", nullable = true)
    private Double targetWeightKg;

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (calorieGoal == null) calorieGoal = 2000.0;
        if (proteinGoal == null) proteinGoal = 130.0;
        if (carbGoal == null) carbGoal = 220.0;
        if (fatGoal == null) fatGoal = 70.0;
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
    public void setId(UUID id)      { this.id = id; }
    public String getDisplayUsername() { return username; }
    public String getEmail()        { return email; }

    public void setUsername(String username)     { this.username = username; }
    public void setEmail(String email)           { this.email = email; }
    public void setPasswordHash(String hash)     { this.passwordHash = hash; }

    public Double getCalorieGoal() { return calorieGoal; }
    public void setCalorieGoal(Double calorieGoal) { this.calorieGoal = calorieGoal; }

    public Double getProteinGoal() { return proteinGoal; }
    public void setProteinGoal(Double proteinGoal) { this.proteinGoal = proteinGoal; }

    public Double getCarbGoal() { return carbGoal; }
    public void setCarbGoal(Double carbGoal) { this.carbGoal = carbGoal; }

    public Double getFatGoal() { return fatGoal; }
    public void setFatGoal(Double fatGoal) { this.fatGoal = fatGoal; }

    public Double getStartingWeightKg() { return startingWeightKg; }
    public void setStartingWeightKg(Double startingWeightKg) { this.startingWeightKg = startingWeightKg; }

    public Double getTargetWeightKg() { return targetWeightKg; }
    public void setTargetWeightKg(Double targetWeightKg) { this.targetWeightKg = targetWeightKg; }
}
