package com.electroghiurai.mys.features.tracker;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.auth.AuthExceptions.AccessDeniedException;
import com.electroghiurai.mys.features.tracker.TrackerDtos.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service to orchestrate food items and tracker daily logs.
 */
@Service
public class TrackerService {

    private final CustomFoodRepository customFoodRepository;
    private final TrackedIngredientRepository trackedIngredientRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private List<FoodItemDto> defaultFoods = new ArrayList<>();

    public TrackerService(CustomFoodRepository customFoodRepository,
                          TrackedIngredientRepository trackedIngredientRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper) {
        this.customFoodRepository = customFoodRepository;
        this.trackedIngredientRepository = trackedIngredientRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        loadDefaultFoods();
    }

    private void loadDefaultFoods() {
        try {
            ClassPathResource resource = new ClassPathResource("default_foods.json");
            try (InputStream inputStream = resource.getInputStream()) {
                List<DefaultFoodJson> list = objectMapper.readValue(
                    inputStream,
                    new TypeReference<List<DefaultFoodJson>>() {}
                );
                this.defaultFoods = list.stream()
                    .map(item -> new FoodItemDto(
                        item.id(),
                        item.name(),
                        item.calories(),
                        item.protein(),
                        item.carbs(),
                        item.fat(),
                        false
                    ))
                    .collect(Collectors.toList());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load default foods database", e);
        }
    }

    public List<FoodItemDto> searchFoods(User user, String query) {
        String cleanQuery = query == null ? "" : query.trim().toLowerCase();
        
        // 1. Filter defaults in-memory
        List<FoodItemDto> matchedDefaults = defaultFoods.stream()
            .filter(f -> f.name().toLowerCase().contains(cleanQuery))
            .collect(Collectors.toList());

        // 2. Fetch custom foods from database
        List<CustomFood> matchedCustom = customFoodRepository.findByUserAndNameContainingIgnoreCase(user, cleanQuery);
        List<FoodItemDto> matchedCustomDtos = matchedCustom.stream()
            .map(cf -> new FoodItemDto(
                cf.getId().toString(),
                cf.getName(),
                cf.getCalories(),
                cf.getProtein(),
                cf.getCarbs(),
                cf.getFat(),
                true
            ))
            .collect(Collectors.toList());

        // 3. Merge lists
        List<FoodItemDto> merged = new ArrayList<>();
        merged.addAll(matchedDefaults);
        merged.addAll(matchedCustomDtos);
        return merged;
    }

    @Transactional
    public FoodItemDto createCustomFood(User user, CreateCustomFoodRequest req) {
        CustomFood cf = new CustomFood();
        cf.setUser(user);
        cf.setName(req.name().trim());
        cf.setCalories(req.calories());
        cf.setProtein(req.protein());
        cf.setCarbs(req.carbs());
        cf.setFat(req.fat());

        cf = customFoodRepository.save(cf);

        return new FoodItemDto(
            cf.getId().toString(),
            cf.getName(),
            cf.getCalories(),
            cf.getProtein(),
            cf.getCarbs(),
            cf.getFat(),
            true
        );
    }

    public List<FoodItemDto> getCustomFoods(User user) {
        List<CustomFood> list = customFoodRepository.findByUser(user);
        return list.stream()
            .map(cf -> new FoodItemDto(
                cf.getId().toString(),
                cf.getName(),
                cf.getCalories(),
                cf.getProtein(),
                cf.getCarbs(),
                cf.getFat(),
                true
            ))
            .collect(Collectors.toList());
    }

    public List<TrackedIngredientDto> getTrackedIngredients(User user, LocalDate date) {
        List<TrackedIngredient> list = trackedIngredientRepository.findByUserAndTrackedDate(user, date);
        return list.stream()
            .map(ti -> new TrackedIngredientDto(
                ti.getId(),
                ti.getName(),
                ti.getWeight(),
                ti.getCaloriesPer100g(),
                ti.getProteinPer100g(),
                ti.getCarbsPer100g(),
                ti.getFatPer100g(),
                ti.getTrackedDate()
            ))
            .collect(Collectors.toList());
    }

    public List<TrackedIngredientDto> getTrackedIngredientsRange(User user, LocalDate start, LocalDate end) {
        List<TrackedIngredient> list = trackedIngredientRepository.findByUserAndTrackedDateBetween(user, start, end);
        return list.stream()
            .map(ti -> new TrackedIngredientDto(
                ti.getId(),
                ti.getName(),
                ti.getWeight(),
                ti.getCaloriesPer100g(),
                ti.getProteinPer100g(),
                ti.getCarbsPer100g(),
                ti.getFatPer100g(),
                ti.getTrackedDate()
            ))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DailySummaryDto> getDailySummaries(User user, LocalDate startDate, LocalDate endDate) {
        List<TrackedIngredient> list = trackedIngredientRepository.findByUserAndTrackedDateBetween(user, startDate, endDate);
        
        java.util.Map<LocalDate, List<TrackedIngredient>> grouped = list.stream()
                .collect(Collectors.groupingBy(TrackedIngredient::getTrackedDate));
                
        List<DailySummaryDto> summaries = new ArrayList<>();
        
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<TrackedIngredient> dayIngredients = grouped.getOrDefault(date, List.of());
            
            double calories = 0;
            double protein = 0;
            double carbs = 0;
            double fat = 0;
            
            for (TrackedIngredient ti : dayIngredients) {
                double mult = ti.getWeight() / 100.0;
                calories += ti.getCaloriesPer100g() * mult;
                protein += ti.getProteinPer100g() * mult;
                carbs += ti.getCarbsPer100g() * mult;
                fat += ti.getFatPer100g() * mult;
            }
            
            summaries.add(new DailySummaryDto(date, calories, protein, carbs, fat));
        }
        
        return summaries;
    }

    @Transactional
    public TrackedIngredientDto addTrackedIngredient(User user, AddTrackedRequest req) {
        String trimmedName = req.name().trim();
        List<TrackedIngredient> existingList = trackedIngredientRepository.findByUserAndTrackedDate(user, req.trackedDate());
        
        TrackedIngredient existing = existingList.stream()
            .filter(ti -> ti.getName().equalsIgnoreCase(trimmedName))
            .findFirst()
            .orElse(null);

        TrackedIngredient ti;
        if (existing != null) {
            ti = existing;
            ti.setWeight(ti.getWeight() + req.weight());
        } else {
            ti = new TrackedIngredient();
            ti.setUser(user);
            ti.setName(trimmedName);
            ti.setWeight(req.weight());
            ti.setCaloriesPer100g(req.caloriesPer100g());
            ti.setProteinPer100g(req.proteinPer100g());
            ti.setCarbsPer100g(req.carbsPer100g());
            ti.setFatPer100g(req.fatPer100g());
            ti.setTrackedDate(req.trackedDate());
        }

        ti = trackedIngredientRepository.save(ti);

        return new TrackedIngredientDto(
            ti.getId(),
            ti.getName(),
            ti.getWeight(),
            ti.getCaloriesPer100g(),
            ti.getProteinPer100g(),
            ti.getCarbsPer100g(),
            ti.getFatPer100g(),
            ti.getTrackedDate()
        );
    }

    @Transactional
    public TrackedIngredientDto updateTrackedIngredient(User user, UUID id, UpdateWeightRequest req) {
        TrackedIngredient ti = trackedIngredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tracked ingredient not found"));

        if (!ti.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized modification");
        }

        ti.setWeight(req.weight());
        ti = trackedIngredientRepository.save(ti);

        return new TrackedIngredientDto(
            ti.getId(),
            ti.getName(),
            ti.getWeight(),
            ti.getCaloriesPer100g(),
            ti.getProteinPer100g(),
            ti.getCarbsPer100g(),
            ti.getFatPer100g(),
            ti.getTrackedDate()
        );
    }

    @Transactional
    public void deleteTrackedIngredient(User user, UUID id) {
        TrackedIngredient ti = trackedIngredientRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tracked ingredient not found"));

        if (!ti.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized deletion");
        }

        trackedIngredientRepository.delete(ti);
    }

    @Transactional(readOnly = true)
    public GoalDto getGoals(User user) {
        return new GoalDto(
            user.getCalorieGoal(),
            user.getProteinGoal(),
            user.getCarbGoal(),
            user.getFatGoal()
        );
    }

    @Transactional
    public GoalDto updateGoals(User user, UpdateGoalRequest req) {
        user.setCalorieGoal(req.calorieGoal());
        user.setProteinGoal(req.proteinGoal());
        user.setCarbGoal(req.carbGoal());
        user.setFatGoal(req.fatGoal());

        userRepository.save(user);

        return new GoalDto(
            user.getCalorieGoal(),
            user.getProteinGoal(),
            user.getCarbGoal(),
            user.getFatGoal()
        );
    }

    private record DefaultFoodJson(
        String id,
        String name,
        Double calories,
        Double protein,
        Double carbs,
        Double fat,
        String category
    ) {}
}
