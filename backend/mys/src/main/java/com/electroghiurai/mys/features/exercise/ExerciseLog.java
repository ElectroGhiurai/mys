package com.electroghiurai.mys.features.exercise;

import com.electroghiurai.mys.features.auth.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entity to store logged gym exercise logs for a user on a given day.
 */
@Entity
@Table(name = "exercise_logs", indexes = {
    @Index(name = "idx_exercise_logs_user_id", columnList = "user_id")
})
public class ExerciseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_exercise_logs_user_id"))
    private User user;

    @Column(name = "exercise_name", nullable = false)
    private String exerciseName;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "logged_date", nullable = false)
    private LocalDate loggedDate;

    @OneToMany(mappedBy = "exerciseLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("setNumber ASC")
    private List<ExerciseSet> sets = new ArrayList<>();

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

    // Helper methods to manage bi-directional association
    public void addSet(ExerciseSet set) {
        sets.add(set);
        set.setExerciseLog(this);
    }

    public void removeSet(ExerciseSet set) {
        sets.remove(set);
        set.setExerciseLog(null);
    }

    public void clearSets() {
        for (ExerciseSet set : new ArrayList<>(sets)) {
            removeSet(set);
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getExerciseName() { return exerciseName; }
    public void setExerciseName(String exerciseName) { this.exerciseName = exerciseName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getLoggedDate() { return loggedDate; }
    public void setLoggedDate(LocalDate loggedDate) { this.loggedDate = loggedDate; }

    public List<ExerciseSet> getSets() { return sets; }
    
    /**
     * @deprecated Use {@link #addSet(ExerciseSet)} and {@link #clearSets()} instead.
     */
    @Deprecated
    public void setSets(List<ExerciseSet> sets) {
        this.clearSets();
        if (sets != null) {
            for (ExerciseSet set : sets) {
                this.addSet(set);
            }
        }
    }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
