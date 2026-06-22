package com.electroghiurai.mys.features.tracker;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request and response DTO records for the calorie tracker.
 */
public final class TrackerDtos {

    private TrackerDtos() {}

    public record FoodItemDto(
        String id,
        String name,
        Double calories,
        Double protein,
        Double carbs,
        Double fat,
        Boolean isCustom
    ) {}

    public record CreateCustomFoodRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be under 100 characters")
        String name,

        @NotNull(message = "Calories is required")
        @DecimalMin(value = "0.0", message = "Calories cannot be negative")
        Double calories,

        @NotNull(message = "Protein is required")
        @DecimalMin(value = "0.0", message = "Protein cannot be negative")
        Double protein,

        @NotNull(message = "Carbs is required")
        @DecimalMin(value = "0.0", message = "Carbs cannot be negative")
        Double carbs,

        @NotNull(message = "Fat is required")
        @DecimalMin(value = "0.0", message = "Fat cannot be negative")
        Double fat
    ) {}

    public record AddTrackedRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotNull(message = "Weight is required")
        @DecimalMin(value = "0.1", message = "Weight must be at least 0.1 grams")
        Double weight,

        @NotNull(message = "Calories per 100g is required")
        @DecimalMin(value = "0.0", message = "Calories cannot be negative")
        Double caloriesPer100g,

        @NotNull(message = "Protein per 100g is required")
        @DecimalMin(value = "0.0", message = "Protein cannot be negative")
        Double proteinPer100g,

        @NotNull(message = "Carbs per 100g is required")
        @DecimalMin(value = "0.0", message = "Carbs cannot be negative")
        Double carbsPer100g,

        @NotNull(message = "Fat per 100g is required")
        @DecimalMin(value = "0.0", message = "Fat cannot be negative")
        Double fatPer100g,

        @NotNull(message = "Tracked date is required")
        LocalDate trackedDate
    ) {}

    public record UpdateWeightRequest(
        @NotNull(message = "Weight is required")
        @DecimalMin(value = "0.1", message = "Weight must be at least 0.1 grams")
        Double weight
    ) {}

    public record TrackedIngredientDto(
        UUID id,
        String name,
        Double weight,
        Double caloriesPer100g,
        Double proteinPer100g,
        Double carbsPer100g,
        Double fatPer100g,
        LocalDate trackedDate
    ) {}

    public record GoalDto(
        Double calorieGoal,
        Double proteinGoal,
        Double carbGoal,
        Double fatGoal
    ) {}

    public record UpdateGoalRequest(
        @NotNull(message = "Calorie goal is required")
        @DecimalMin(value = "500.0", message = "Calorie goal must be at least 500 kcal")
        Double calorieGoal,

        @NotNull(message = "Protein goal is required")
        @DecimalMin(value = "10.0", message = "Protein goal must be at least 10g")
        Double proteinGoal,

        @NotNull(message = "Carb goal is required")
        @DecimalMin(value = "10.0", message = "Carb goal must be at least 10g")
        Double carbGoal,

        @NotNull(message = "Fat goal is required")
        @DecimalMin(value = "5.0", message = "Fat goal must be at least 5g")
        Double fatGoal
    ) {}

    public record DailySummaryDto(
        LocalDate date,
        Double calories,
        Double protein,
        Double carbs,
        Double fat
    ) {}
}
