package com.electroghiurai.mys.features.weight;

import com.electroghiurai.mys.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Data access for WeightLog.
 */
@Repository
public interface WeightLogRepository extends JpaRepository<WeightLog, UUID> {
    List<WeightLog> findByUserOrderByLoggedDateAsc(User user);
    Optional<WeightLog> findByUserAndLoggedDate(User user, LocalDate loggedDate);
}
