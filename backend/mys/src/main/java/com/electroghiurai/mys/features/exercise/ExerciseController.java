package com.electroghiurai.mys.features.exercise;

import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.exercise.ExerciseDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller exposing gym exercise log management endpoints.
 */
@RestController
@RequestMapping("/api/v1/exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    public ExerciseController(ExerciseService exerciseService) {
        this.exerciseService = exerciseService;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<ExerciseLogDto>>> getExercises(
            @AuthenticationPrincipal User user) {
        List<ExerciseLogDto> data = exerciseService.getExercises(user);
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping
    public ResponseEntity<Map<String, ExerciseLogDto>> logExercise(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LogExerciseRequest req) {
        ExerciseLogDto data = exerciseService.logExercise(user, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExercise(
            @AuthenticationPrincipal User user,
            @PathVariable(name = "id") UUID id) {
        exerciseService.deleteExercise(user, id);
        return ResponseEntity.noContent().build();
    }
}
