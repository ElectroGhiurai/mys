package com.electroghiurai.mys.features.exercise;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Data Transfer Objects for the Exercise feature.
 */
public final class ExerciseDtos {

    private ExerciseDtos() {}

    public record ExerciseSetDto(
        UUID id,
        int setNumber,
        Double weight,
        Integer reps,
        Double distanceKm,
        Integer durationMinutes
    ) {}

    public record ExerciseLogDto(
        UUID id,
        String exerciseName,
        String category,
        LocalDate loggedDate,
        List<ExerciseSetDto> sets
    ) {}

    public record LogExerciseSetRequest(
        @NotNull(message = "Set number is required")
        @Min(value = 1, message = "Set number must be at least 1")
        Integer setNumber,

        @Min(value = 0, message = "Weight must be at least 0")
        Double weight,

        @Min(value = 0, message = "Reps must be at least 0")
        Integer reps,

        @Min(value = 0, message = "Distance must be at least 0")
        Double distanceKm,

        @Min(value = 0, message = "Duration must be at least 0")
        Integer durationMinutes
    ) {}

    public record LogExerciseRequest(
        UUID id,

        @NotBlank(message = "Exercise name is required")
        @Size(max = 100, message = "Exercise name must be under 100 characters")
        String exerciseName,

        @NotBlank(message = "Category is required")
        @Size(max = 50, message = "Category must be under 50 characters")
        String category,

        @NotNull(message = "Logged date is required")
        @PastOrPresent(message = "Logged date cannot be in the future")
        LocalDate loggedDate,

        @NotNull(message = "Sets are required")
        @Size(min = 1, message = "At least one set is required")
        @Valid
        List<LogExerciseSetRequest> sets
    ) {}
}
