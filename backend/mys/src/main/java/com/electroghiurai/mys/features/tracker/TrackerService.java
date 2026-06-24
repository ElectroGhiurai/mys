package com.electroghiurai.mys.features.tracker;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.auth.AuthExceptions.AccessDeniedException;
import com.electroghiurai.mys.features.tracker.TrackerDtos.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(TrackerService.class);

    private final CustomFoodRepository customFoodRepository;
    private final TrackedIngredientRepository trackedIngredientRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final FavoriteFoodRepository favoriteFoodRepository;
    private List<FoodItemDto> defaultFoods = new ArrayList<>();

    public TrackerService(CustomFoodRepository customFoodRepository,
                          TrackedIngredientRepository trackedIngredientRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper,
                          FavoriteFoodRepository favoriteFoodRepository) {
        this.customFoodRepository = customFoodRepository;
        this.trackedIngredientRepository = trackedIngredientRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.favoriteFoodRepository = favoriteFoodRepository;
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
        String cleanQuery = query == null ? "" : query.trim().toLowerCase(java.util.Locale.ROOT);
        
        // 1. Filter defaults in-memory
        List<FoodItemDto> matchedDefaults = defaultFoods.stream()
            .filter(f -> f.name().toLowerCase(java.util.Locale.ROOT).contains(cleanQuery))
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
            user.getFatGoal(),
            user.getStartingWeightKg(),
            user.getTargetWeightKg()
        );
    }

    @Transactional
    public GoalDto updateGoals(User user, UpdateGoalRequest req) {
        user.setCalorieGoal(req.calorieGoal());
        user.setProteinGoal(req.proteinGoal());
        user.setCarbGoal(req.carbGoal());
        user.setFatGoal(req.fatGoal());
        user.setStartingWeightKg(req.startingWeightKg());
        user.setTargetWeightKg(req.targetWeightKg());

        userRepository.save(user);

        return new GoalDto(
            user.getCalorieGoal(),
            user.getProteinGoal(),
            user.getCarbGoal(),
            user.getFatGoal(),
            user.getStartingWeightKg(),
            user.getTargetWeightKg()
        );
    }

    public List<FoodItemDto> getFrequentFoods(User user) {
        log.info("Fetching frequent foods for userId={}", user.getId());
        List<TrackedIngredient> recent = trackedIngredientRepository.findTop200ByUserOrderByTrackedDateDesc(user);
        
        // Group by food name case-insensitively, counting frequency
        java.util.Map<String, Long> frequencyMap = recent.stream()
            .collect(Collectors.groupingBy(
                ti -> ti.getName().trim().toLowerCase(java.util.Locale.ROOT),
                Collectors.counting()
            ));

        // Group by food name case-insensitively and select one representative entity for macro values
        java.util.Map<String, TrackedIngredient> representativeMap = recent.stream()
            .collect(Collectors.toMap(
                ti -> ti.getName().trim().toLowerCase(java.util.Locale.ROOT),
                ti -> ti,
                (existing, replacement) -> existing // keep first (most recent)
            ));

        List<FoodItemDto> list = frequencyMap.entrySet().stream()
            .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue())) // sort by frequency desc
            .map(entry -> {
                TrackedIngredient rep = representativeMap.get(entry.getKey());
                return new FoodItemDto(
                    "freq-" + rep.getId().toString(),
                    rep.getName(),
                    rep.getCaloriesPer100g(),
                    rep.getProteinPer100g(),
                    rep.getCarbsPer100g(),
                    rep.getFatPer100g(),
                    false
                );
            })
            .limit(10) // top 10 frequent
            .collect(Collectors.toList());

        log.info("Found {} frequent foods for userId={}", list.size(), user.getId());
        return list;
    }

    @Transactional(readOnly = true)
    public List<FoodItemDto> getFavouriteFoods(User user) {
        log.info("Fetching favorite foods for userId={}", user.getId());
        return favoriteFoodRepository.findByUser(user).stream()
            .map(ff -> new FoodItemDto(
                ff.getId().toString(),
                ff.getName(),
                ff.getCalories(),
                ff.getProtein(),
                ff.getCarbs(),
                ff.getFat(),
                false
            ))
            .collect(Collectors.toList());
    }

    @Transactional
    public FoodItemDto addFavouriteFood(User user, AddFavoriteFoodRequest req) {
        log.info("Adding favorite food for userId={} name={}", user.getId(), req.name());
        
        java.util.Optional<FavoriteFood> existing = favoriteFoodRepository.findByUserAndNameIgnoreCase(user, req.name().trim());
        if (existing.isPresent()) {
            log.info("Favorite food already exists: id={}", existing.get().getId());
            FavoriteFood ff = existing.get();
            return new FoodItemDto(
                ff.getId().toString(),
                ff.getName(),
                ff.getCalories(),
                ff.getProtein(),
                ff.getCarbs(),
                ff.getFat(),
                false
            );
        }

        FavoriteFood ff = new FavoriteFood();
        ff.setUser(user);
        ff.setName(req.name().trim());
        ff.setCalories(req.calories());
        ff.setProtein(req.protein());
        ff.setCarbs(req.carbs());
        ff.setFat(req.fat());

        FavoriteFood saved = favoriteFoodRepository.save(ff);
        log.info("Added favorite food success: id={}", saved.getId());
        return new FoodItemDto(
            saved.getId().toString(),
            saved.getName(),
            saved.getCalories(),
            saved.getProtein(),
            saved.getCarbs(),
            saved.getFat(),
            false
        );
    }

    @Transactional
    public void deleteFavouriteFood(User user, UUID id) {
        log.info("Deleting favorite food for userId={} id={}", user.getId(), id);
        FavoriteFood ff = favoriteFoodRepository.findById(id)
            .orElseThrow(() -> new com.electroghiurai.mys.common.ResourceNotFoundException("Favorite food not found"));

        if (!ff.getUser().getId().equals(user.getId())) {
            log.warn("Access denied: User={} tried to delete favorite food belonging to User={}", user.getId(), ff.getUser().getId());
            throw new AccessDeniedException("Unauthorized deletion of favorite food");
        }

        favoriteFoodRepository.delete(ff);
        log.info("Deleted favorite food success: id={}", id);
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
