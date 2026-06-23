package com.electroghiurai.mys.features.weight;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTOs for Weight logging features.
 */
public final class WeightDtos {

    private WeightDtos() {}

    public record WeightLogDto(
        UUID id,
        double weightKg,
        LocalDate loggedDate
    ) {}

    public record LogWeightRequest(
        @NotNull(message = "Weight is required")
        @DecimalMin(value = "20.0", message = "Weight must be at least 20 kg")
        @DecimalMax(value = "300.0", message = "Weight must be at most 300 kg")
        Double weightKg,

        @NotNull(message = "Logged date is required")
        @PastOrPresent(message = "Logged date cannot be in the future")
        LocalDate loggedDate
    ) {}
}
