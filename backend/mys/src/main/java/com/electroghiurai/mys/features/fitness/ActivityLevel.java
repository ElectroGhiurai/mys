package com.electroghiurai.mys.features.fitness;

public enum ActivityLevel {
    SEDENTARY("Sedentary"),
    LIGHTLY_ACTIVE("Lightly active"),
    MODERATELY_ACTIVE("Moderately active"),
    VERY_ACTIVE("Very active"),
    EXTRA_ACTIVE("Extra active");

    private final String displayName;

    ActivityLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static double getActivityFactor(ActivityLevel activityLevel) {
        return switch (activityLevel) {
            case SEDENTARY -> 1.2;
            case LIGHTLY_ACTIVE -> 1.375;
            case MODERATELY_ACTIVE -> 1.55;
            case VERY_ACTIVE -> 1.725;
            case EXTRA_ACTIVE -> 1.9;
            default -> 1.2;
        };
    }
}
