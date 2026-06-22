package com.electroghiurai.mys.features.tracker;

import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.tracker.TrackerDtos.*;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller to expose endpoints for foods search, custom foods, and tracking logs.
 */
@RestController
@RequestMapping("/api/v1")
public class TrackerController {

    private static final Logger log = LoggerFactory.getLogger(TrackerController.class);
    private final TrackerService trackerService;

    public TrackerController(TrackerService trackerService) {
        this.trackerService = trackerService;
    }

    @GetMapping("/foods")
    public ResponseEntity<Map<String, List<FoodItemDto>>> searchFoods(
            @AuthenticationPrincipal User user,
            @RequestParam(name = "query", required = false, defaultValue = "") String query) {
        log.info("Searching foods for userId={} query='{}'", user.getId(), query);
        List<FoodItemDto> data = trackerService.searchFoods(user, query);
        log.info("Found {} food items for query='{}'", data.size(), query);
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping("/foods/custom")
    public ResponseEntity<Map<String, FoodItemDto>> createCustomFood(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateCustomFoodRequest req) {
        log.info("Creating custom food for userId={} foodName='{}'", user.getId(), req.name());
        FoodItemDto data = trackerService.createCustomFood(user, req);
        log.info("Created custom food successfully: foodId={} foodName='{}'", data.id(), data.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", data));
    }

    @GetMapping("/foods/custom")
    public ResponseEntity<Map<String, List<FoodItemDto>>> getCustomFoods(
            @AuthenticationPrincipal User user) {
        log.info("Fetching custom foods for userId={}", user.getId());
        List<FoodItemDto> data = trackerService.getCustomFoods(user);
        log.info("Found {} custom foods for userId={}", data.size(), user.getId());
        return ResponseEntity.ok(Map.of("data", data));
    }

    @GetMapping("/tracker")
    public ResponseEntity<Map<String, List<TrackedIngredientDto>>> getTracked(
            @AuthenticationPrincipal User user,
            @RequestParam(name = "date") String dateStr) {
        LocalDate date = LocalDate.parse(dateStr);
        log.info("Fetching tracked ingredients for userId={} date={}", user.getId(), date);
        List<TrackedIngredientDto> data = trackerService.getTrackedIngredients(user, date);
        log.info("Found {} tracked items for userId={} date={}", data.size(), user.getId(), date);
        return ResponseEntity.ok(Map.of("data", data));
    }

    @GetMapping("/tracker/range")
    public ResponseEntity<Map<String, List<DailySummaryDto>>> getTrackedRange(
            @AuthenticationPrincipal User user,
            @RequestParam(name = "start") String startStr,
            @RequestParam(name = "end") String endStr) {
        LocalDate start = LocalDate.parse(startStr);
        LocalDate end = LocalDate.parse(endStr);
        log.info("Fetching daily summaries for userId={} start={} end={}", user.getId(), start, end);
        List<DailySummaryDto> data = trackerService.getDailySummaries(user, start, end);
        log.info("Fetched {} daily summaries for userId={}", data.size(), user.getId());
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping("/tracker")
    public ResponseEntity<Map<String, TrackedIngredientDto>> addTracked(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AddTrackedRequest req) {
        log.info("Adding tracked ingredient for userId={} foodName='{}' weight={}g", user.getId(), req.name(), req.weight());
        TrackedIngredientDto data = trackerService.addTrackedIngredient(user, req);
        log.info("Added tracked ingredient successfully: trackedId={} foodName='{}'", data.id(), data.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", data));
    }

    @PutMapping("/tracker/{id}")
    public ResponseEntity<Map<String, TrackedIngredientDto>> updateTracked(
            @AuthenticationPrincipal User user,
            @PathVariable(name = "id") UUID id,
            @Valid @RequestBody UpdateWeightRequest req) {
        log.info("Updating tracked ingredient weight: userId={} trackedId={} newWeight={}g", user.getId(), id, req.weight());
        TrackedIngredientDto data = trackerService.updateTrackedIngredient(user, id, req);
        log.info("Updated tracked ingredient weight successfully: trackedId={}", data.id());
        return ResponseEntity.ok(Map.of("data", data));
    }

    @DeleteMapping("/tracker/{id}")
    public ResponseEntity<Void> deleteTracked(
            @AuthenticationPrincipal User user,
            @PathVariable(name = "id") UUID id) {
        log.info("Deleting tracked ingredient: userId={} trackedId={}", user.getId(), id);
        trackerService.deleteTrackedIngredient(user, id);
        log.info("Deleted tracked ingredient successfully: trackedId={}", id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/goals")
    public ResponseEntity<Map<String, GoalDto>> getGoals(
            @AuthenticationPrincipal User user) {
        log.info("Fetching nutrition goals for userId={}", user.getId());
        GoalDto data = trackerService.getGoals(user);
        log.info("Fetched nutrition goals for userId={} values={}", user.getId(), data);
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PutMapping("/goals")
    public ResponseEntity<Map<String, GoalDto>> updateGoals(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateGoalRequest req) {
        log.info("Updating nutrition goals for userId={} newGoals={}", user.getId(), req);
        GoalDto data = trackerService.updateGoals(user, req);
        log.info("Updated nutrition goals successfully for userId={} values={}", user.getId(), data);
        return ResponseEntity.ok(Map.of("data", data));
    }
}
