package com.electroghiurai.mys.features.exercise;

import com.electroghiurai.mys.features.auth.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Data access repository for ExerciseLog.
 */
@Repository
@SuppressWarnings("PMD.ImplicitFunctionalInterface")
public interface ExerciseLogRepository extends JpaRepository<ExerciseLog, UUID> {

    @EntityGraph(attributePaths = {"sets"})
    List<ExerciseLog> findByUserOrderByLoggedDateDesc(User user);
}
