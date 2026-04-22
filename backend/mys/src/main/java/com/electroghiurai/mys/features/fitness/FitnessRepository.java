package com.electroghiurai.mys.features.fitness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import com.electroghiurai.mys.features.auth.User;

@Repository
public interface FitnessRepository extends JpaRepository<FitnessProfile, UUID> {
    Optional<FitnessProfile> findByUserId(UUID userId);

    Optional<FitnessProfile> findByUser(User user);

}
