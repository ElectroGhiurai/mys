package com.electroghiurai.mys.features.fitness;

public enum FitnessGoal {
    LOSE_WEIGHT("Lose weight"),
    MAINTAIN_WEIGHT("Maintain weight"),
    GAIN_MUSCLE("Gain muscle");

    private final String displayName;

    FitnessGoal(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

}
