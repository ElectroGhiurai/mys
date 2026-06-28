package com.electroghiurai.mys.features.tracker;

import com.electroghiurai.mys.features.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity for user-specific favorite food items.
 */
@Entity
@Table(name = "favorite_foods", uniqueConstraints = {
    @UniqueConstraint(name = "uq_favorite_foods_user_name", columnNames = {"user_id", "name"})
}, indexes = {
    @Index(name = "idx_favorite_foods_user_id", columnList = "user_id")
})
public class FavoriteFood {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_favorite_foods_user_id"))
    private User user;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "calories", nullable = false)
    private Double calories; // per 100g

    @Column(name = "protein", nullable = false)
    private Double protein; // per 100g

    @Column(name = "carbs", nullable = false)
    private Double carbs; // per 100g

    @Column(name = "fat", nullable = false)
    private Double fat; // per 100g

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    private void onCreate() {
        createdAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getCalories() { return calories; }
    public void setCalories(Double calories) { this.calories = calories; }

    public Double getProtein() { return protein; }
    public void setProtein(Double protein) { this.protein = protein; }

    public Double getCarbs() { return carbs; }
    public void setCarbs(Double carbs) { this.carbs = carbs; }

    public Double getFat() { return fat; }
    public void setFat(Double fat) { this.fat = fat; }

    public Instant getCreatedAt() { return createdAt; }
}
