package com.electroghiurai.mys.features.tracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.tracker.TrackerDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TrackerServiceTest {

    private CustomFoodRepository customFoodRepository;
    private TrackedIngredientRepository trackedIngredientRepository;
    private UserRepository userRepository;
    private FavoriteFoodRepository favoriteFoodRepository;
    private TrackerService trackerService;
    private User testUser;

    @BeforeEach
    void setUp() {
        customFoodRepository = mock(CustomFoodRepository.class);
        trackedIngredientRepository = mock(TrackedIngredientRepository.class);
        userRepository = mock(UserRepository.class);
        favoriteFoodRepository = mock(FavoriteFoodRepository.class);
        
        trackerService = new TrackerService(
            customFoodRepository,
            trackedIngredientRepository,
            userRepository,
            new ObjectMapper(),
            favoriteFoodRepository
        );

        testUser = new User();
        // Set properties
        testUser.setEmail("test@test.com");
        testUser.setUsername("testuser");
        
        // Mock ID generation to avoid null pointer when comparing IDs
        UUID userId = UUID.randomUUID();
        User mockUser = mock(User.class);
        when(mockUser.getId()).thenReturn(userId);
        when(mockUser.getEmail()).thenReturn("test@test.com");
        when(mockUser.getDisplayUsername()).thenReturn("testuser");
        testUser = mockUser;
    }

    @Test
    void searchFoods_withEmptyQuery_returnsSeededDefaults() {
        // Act
        List<FoodItemDto> results = trackerService.searchFoods(testUser, "");

        // Assert
        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(f -> f.name().equalsIgnoreCase("Chicken breast (cooked)")));
    }

    @Test
    void searchFoods_withQuery_filtersDefaultsAndCustom() {
        // Arrange
        when(customFoodRepository.findByUserAndNameContainingIgnoreCase(testUser, "oats (dry)"))
            .thenReturn(Collections.emptyList());

        // Act
        List<FoodItemDto> results = trackerService.searchFoods(testUser, "oats (dry)");

        // Assert
        assertEquals(1, results.size());
        assertEquals("Oats (dry)", results.get(0).name());
        assertFalse(results.get(0).isCustom());
    }

    @Test
    void createCustomFood_savesAndReturnsDto() {
        // Arrange
        CreateCustomFoodRequest req = new CreateCustomFoodRequest(
            "My Shake", 200.0, 15.0, 30.0, 5.0
        );

        UUID customId = UUID.randomUUID();
        when(customFoodRepository.save(any(CustomFood.class))).thenAnswer(invocation -> {
            CustomFood saved = invocation.getArgument(0);
            saved.setId(customId);
            return saved;
        });

        // Act
        FoodItemDto result = trackerService.createCustomFood(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals(customId.toString(), result.id());
        assertEquals("My Shake", result.name());
        assertEquals(200.0, result.calories());
        assertEquals(15.0, result.protein());
        assertEquals(30.0, result.carbs());
        assertEquals(5.0, result.fat());
        assertTrue(result.isCustom());
    }

    @Test
    void addTrackedIngredient_savesAndReturnsDto() {
        // Arrange
        AddTrackedRequest req = new AddTrackedRequest(
            "Chicken", 150.0, 165.0, 31.0, 0.0, 3.6, LocalDate.now()
        );

        UUID trackedId = UUID.randomUUID();
        when(trackedIngredientRepository.save(any(TrackedIngredient.class))).thenAnswer(invocation -> {
            TrackedIngredient saved = invocation.getArgument(0);
            saved.setId(trackedId);
            return saved;
        });

        // Act
        TrackedIngredientDto result = trackerService.addTrackedIngredient(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals(trackedId, result.id());
        assertEquals("Chicken", result.name());
        assertEquals(150.0, result.weight());
        assertEquals(165.0, result.caloriesPer100g());
    }

    @Test
    void addTrackedIngredient_whenDuplicateExists_updatesWeight() {
        // Arrange
        LocalDate today = LocalDate.now();
        AddTrackedRequest req = new AddTrackedRequest(
            "banana", 100.0, 89.0, 1.1, 22.8, 0.3, today
        );

        UUID trackedId = UUID.randomUUID();
        TrackedIngredient existing = new TrackedIngredient();
        existing.setId(trackedId);
        existing.setUser(testUser);
        existing.setName("Banana");
        existing.setWeight(150.0);
        existing.setTrackedDate(today);

        when(trackedIngredientRepository.findByUserAndTrackedDate(testUser, today))
            .thenReturn(List.of(existing));
        when(trackedIngredientRepository.save(any(TrackedIngredient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        TrackedIngredientDto result = trackerService.addTrackedIngredient(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals(trackedId, result.id());
        assertEquals("Banana", result.name());
        assertEquals(250.0, result.weight()); // 150 + 100
    }

    @Test
    void updateTrackedIngredient_withValidUser_updatesWeight() {
        // Arrange
        UUID trackedId = UUID.randomUUID();
        TrackedIngredient existing = new TrackedIngredient();
        existing.setId(trackedId);
        existing.setUser(testUser);
        existing.setName("Salmon");
        existing.setWeight(100.0);
        existing.setCaloriesPer100g(208.0);
        existing.setProteinPer100g(20.0);
        existing.setCarbsPer100g(0.0);
        existing.setFatPer100g(13.0);
        existing.setTrackedDate(LocalDate.now());

        when(trackedIngredientRepository.findById(trackedId)).thenReturn(Optional.of(existing));
        when(trackedIngredientRepository.save(any(TrackedIngredient.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateWeightRequest req = new UpdateWeightRequest(200.0);

        // Act
        TrackedIngredientDto result = trackerService.updateTrackedIngredient(testUser, trackedId, req);

        // Assert
        assertNotNull(result);
        assertEquals(200.0, result.weight());
    }

    @Test
    void getGoals_returnsUserGoals() {
        // Arrange
        when(testUser.getCalorieGoal()).thenReturn(2500.0);
        when(testUser.getProteinGoal()).thenReturn(150.0);
        when(testUser.getCarbGoal()).thenReturn(300.0);
        when(testUser.getFatGoal()).thenReturn(80.0);

        // Act
        GoalDto result = trackerService.getGoals(testUser);

        // Assert
        assertNotNull(result);
        assertEquals(2500.0, result.calorieGoal());
        assertEquals(150.0, result.proteinGoal());
        assertEquals(300.0, result.carbGoal());
        assertEquals(80.0, result.fatGoal());
    }

    @Test
    void updateGoals_savesAndReturnsGoals() {
        // Arrange
        UpdateGoalRequest req = new UpdateGoalRequest(1800.0, 140.0, 180.0, 60.0, null, null);

        // Act
        GoalDto result = trackerService.updateGoals(testUser, req);

        // Assert
        verify(testUser).setCalorieGoal(1800.0);
        verify(testUser).setProteinGoal(140.0);
        verify(testUser).setCarbGoal(180.0);
        verify(testUser).setFatGoal(60.0);
        verify(userRepository).save(testUser);
        assertNotNull(result);
    }

    @Test
    void getFrequentFoods_aggregatesAndSortsByFrequency() {
        // Arrange
        TrackedIngredient ti1 = new TrackedIngredient();
        ti1.setId(UUID.randomUUID());
        ti1.setName("Chicken breast (cooked)");
        ti1.setCaloriesPer100g(165.0);
        ti1.setProteinPer100g(31.0);
        ti1.setCarbsPer100g(0.0);
        ti1.setFatPer100g(3.6);

        TrackedIngredient ti2 = new TrackedIngredient();
        ti2.setId(UUID.randomUUID());
        ti2.setName("Chicken breast (cooked)");
        ti2.setCaloriesPer100g(165.0);
        ti2.setProteinPer100g(31.0);
        ti2.setCarbsPer100g(0.0);
        ti2.setFatPer100g(3.6);

        TrackedIngredient ti3 = new TrackedIngredient();
        ti3.setId(UUID.randomUUID());
        ti3.setName("Banana");
        ti3.setCaloriesPer100g(89.0);
        ti3.setProteinPer100g(1.1);
        ti3.setCarbsPer100g(23.0);
        ti3.setFatPer100g(0.3);

        when(trackedIngredientRepository.findTop200ByUserOrderByTrackedDateDesc(testUser))
            .thenReturn(List.of(ti1, ti2, ti3));

        // Act
        List<FoodItemDto> result = trackerService.getFrequentFoods(testUser);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Chicken breast (cooked)", result.get(0).name()); // highest frequency (2)
        assertEquals("Banana", result.get(1).name()); // lower frequency (1)
    }

    @Test
    void getFavouriteFoods_returnsManualFavorites() {
        // Arrange
        FavoriteFood ff = new FavoriteFood();
        ff.setId(UUID.randomUUID());
        ff.setName("Blueberries");
        ff.setCalories(57.0);
        ff.setProtein(0.7);
        ff.setCarbs(14.0);
        ff.setFat(0.3);
        ff.setUser(testUser);

        when(favoriteFoodRepository.findByUser(testUser)).thenReturn(List.of(ff));

        // Act
        List<FoodItemDto> result = trackerService.getFavouriteFoods(testUser);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Blueberries", result.get(0).name());
    }

    @Test
    void addFavouriteFood_savesFavoriteIfNotPresent() {
        // Arrange
        AddFavoriteFoodRequest req = new AddFavoriteFoodRequest("Strawberries", 32.0, 0.7, 7.7, 0.3);
        when(favoriteFoodRepository.findByUserAndNameIgnoreCase(testUser, "Strawberries")).thenReturn(Optional.empty());
        when(favoriteFoodRepository.save(any(FavoriteFood.class))).thenAnswer(inv -> {
            FavoriteFood saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        // Act
        FoodItemDto result = trackerService.addFavouriteFood(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals("Strawberries", result.name());
        verify(favoriteFoodRepository).save(any(FavoriteFood.class));
    }

    @Test
    void deleteFavouriteFood_ofSelf_succeeds() {
        // Arrange
        UUID favId = UUID.randomUUID();
        FavoriteFood ff = new FavoriteFood();
        ff.setId(favId);
        ff.setUser(testUser);

        when(favoriteFoodRepository.findById(favId)).thenReturn(Optional.of(ff));

        // Act
        trackerService.deleteFavouriteFood(testUser, favId);

        // Assert
        verify(favoriteFoodRepository).delete(ff);
    }
}
