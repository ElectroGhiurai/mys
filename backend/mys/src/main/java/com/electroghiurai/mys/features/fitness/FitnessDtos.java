package com.electroghiurai.mys.features.fitness;

import java.time.Instant;

public final class FitnessDtos {

    public FitnessDtos() {
    }

    public record FitnessProfileRequest(
            double weight,
            int height,
            int age,
            ActivityLevel activityLevel,
            FitnessGoal fitnessGoal) {
    }

    public record FitnessProfileResponse(
            double weight,
            int height,
            int age,
            ActivityLevel activityLevel,
            FitnessGoal fitnessGoal,
            Instant createdAt,
            Instant updatedAt) {
    }

}
