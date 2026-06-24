package com.electroghiurai.mys.features.tracker;

import com.electroghiurai.mys.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Data access for TrackedIngredient.
 */
@Repository
public interface TrackedIngredientRepository extends JpaRepository<TrackedIngredient, UUID> {
    List<TrackedIngredient> findByUserAndTrackedDate(User user, LocalDate trackedDate);
    List<TrackedIngredient> findByUserAndTrackedDateBetween(User user, LocalDate start, LocalDate end);
    List<TrackedIngredient> findTop200ByUserOrderByTrackedDateDesc(User user);
}
