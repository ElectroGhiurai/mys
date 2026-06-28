package com.electroghiurai.mys.features.weight;

import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.weight.WeightDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller exposing weight log management endpoints.
 */
@RestController
@RequestMapping("/api/v1/weights")
public class WeightController {

    private final WeightService weightService;

    public WeightController(WeightService weightService) {
        this.weightService = weightService;
    }

    @GetMapping
    public ResponseEntity<Map<String, List<WeightLogDto>>> getWeights(
            @AuthenticationPrincipal User user) {
        List<WeightLogDto> data = weightService.getWeights(user);
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping
    public ResponseEntity<Map<String, WeightLogDto>> logWeight(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody LogWeightRequest req) {
        WeightLogDto data = weightService.logWeight(user, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWeight(
            @AuthenticationPrincipal User user,
            @PathVariable(name = "id") UUID id) {
        weightService.deleteWeight(user, id);
        return ResponseEntity.noContent().build();
    }
}
