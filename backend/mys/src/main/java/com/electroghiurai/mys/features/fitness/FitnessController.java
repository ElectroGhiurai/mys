package com.electroghiurai.mys.features.fitness;

import org.springframework.web.bind.annotation.RestController;

import com.electroghiurai.mys.features.fitness.FitnessDtos.FitnessProfileResponse;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.fitness.FitnessDtos.FitnessProfileRequest;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestMapping;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/fitness/v1")
public class FitnessController {

    private final FitnessService fitnessService;

    public FitnessController(FitnessService fitnessService) {
        this.fitnessService = fitnessService;
    }

    @PostMapping("/profile")
    public ResponseEntity<FitnessProfileResponse> postFitnessProfile(
            @Valid @RequestBody FitnessProfileRequest request,
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        FitnessProfile profile = new FitnessProfile();
        profile.setWeightKg(request.weight());
        profile.setHeightCm(request.height());
        profile.setAge(request.age());
        profile.setActivityLevel(request.activityLevel());
        profile.setFitnessGoal(request.fitnessGoal());

        profile = fitnessService.saveFitnessProfile(profile);

        FitnessProfileResponse response = new FitnessProfileResponse(
                profile.getWeightKg(),
                profile.getHeightCm(),
                profile.getAge(),
                profile.getActivityLevel(),
                profile.getFitnessGoal(),
                profile.getCreatedAt(),
                profile.getUpdatedAt());

        return ResponseEntity.created(null).body(response);
    }

}
