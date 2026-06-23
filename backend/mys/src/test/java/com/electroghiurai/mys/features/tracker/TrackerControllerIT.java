package com.electroghiurai.mys.features.tracker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.auth.JwtService;
import com.electroghiurai.mys.features.tracker.TrackerDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TrackerControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackedIngredientRepository trackedIngredientRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser1;
    private User testUser2;
    private String tokenUser1;

    @BeforeEach
    void setUp() {
        trackedIngredientRepository.deleteAll();
        userRepository.deleteAll();

        // Create user 1
        testUser1 = new User();
        testUser1.setUsername("user_one");
        testUser1.setEmail("one@example.com");
        testUser1.setPasswordHash("hashedpassword");
        testUser1 = userRepository.save(testUser1);

        // Generate token for user 1
        tokenUser1 = jwtService.generateAccessToken(testUser1);

        // Create user 2
        testUser2 = new User();
        testUser2.setUsername("user_two");
        testUser2.setEmail("two@example.com");
        testUser2.setPasswordHash("hashedpassword");
        testUser2 = userRepository.save(testUser2);
    }

    @Test
    void endpoints_withoutAuth_return401() throws Exception {
        mockMvc.perform(get("/api/v1/foods"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/tracker?date=2026-06-22"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/goals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void searchFoods_withAuth_returnsDefaultAndCustomFoods() throws Exception {
        mockMvc.perform(get("/api/v1/foods?query=Oats")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].name", containsString("Oats")));
    }

    @Test
    void addAndGetTracked_withAuth_succeeds() throws Exception {
        LocalDate date = LocalDate.now();
        AddTrackedRequest addReq = new AddTrackedRequest(
                "Banana", 120.0, 89.0, 22.8, 1.1, 0.3, date
        );

        // Add
        mockMvc.perform(post("/api/v1/tracker")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.name", is("Banana")))
                .andExpect(jsonPath("$.data.weight", is(120.0)));

        // Get
        mockMvc.perform(get("/api/v1/tracker?date=" + date)
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name", is("Banana")));
    }

    @Test
    void updateAndDeleteTracked_ownedResource_succeeds() throws Exception {
        TrackedIngredient ti = new TrackedIngredient();
        ti.setUser(testUser1);
        ti.setName("Apple");
        ti.setWeight(100.0);
        ti.setCaloriesPer100g(52.0);
        ti.setProteinPer100g(0.3);
        ti.setCarbsPer100g(14.0);
        ti.setFatPer100g(0.2);
        ti.setTrackedDate(LocalDate.now());
        ti = trackedIngredientRepository.save(ti);

        // Update
        UpdateWeightRequest updateReq = new UpdateWeightRequest(150.0);
        mockMvc.perform(put("/api/v1/tracker/" + ti.getId())
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.weight", is(150.0)));

        // Delete
        mockMvc.perform(delete("/api/v1/tracker/" + ti.getId())
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateTracked_foreignResource_returns403Forbidden() throws Exception {
        // Create tracked ingredient owned by User 2
        TrackedIngredient ti = new TrackedIngredient();
        ti.setUser(testUser2);
        ti.setName("Pear");
        ti.setWeight(100.0);
        ti.setCaloriesPer100g(57.0);
        ti.setProteinPer100g(0.4);
        ti.setCarbsPer100g(15.0);
        ti.setFatPer100g(0.1);
        ti.setTrackedDate(LocalDate.now());
        ti = trackedIngredientRepository.save(ti);

        // User 1 tries to update User 2's ingredient
        UpdateWeightRequest updateReq = new UpdateWeightRequest(150.0);
        mockMvc.perform(put("/api/v1/tracker/" + ti.getId())
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is("error")))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void deleteTracked_foreignResource_returns403Forbidden() throws Exception {
        // Create tracked ingredient owned by User 2
        TrackedIngredient ti = new TrackedIngredient();
        ti.setUser(testUser2);
        ti.setName("Pear");
        ti.setWeight(100.0);
        ti.setCaloriesPer100g(57.0);
        ti.setProteinPer100g(0.4);
        ti.setCarbsPer100g(15.0);
        ti.setFatPer100g(0.1);
        ti.setTrackedDate(LocalDate.now());
        ti = trackedIngredientRepository.save(ti);

        // User 1 tries to delete User 2's ingredient
        mockMvc.perform(delete("/api/v1/tracker/" + ti.getId())
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is("error")))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    void getTrackedRange_withAuth_succeeds() throws Exception {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        LocalDate tomorrow = today.plusDays(1);

        // Save three tracked ingredients on different days
        TrackedIngredient tiYesterday = new TrackedIngredient();
        tiYesterday.setUser(testUser1);
        tiYesterday.setName("Apple");
        tiYesterday.setWeight(100.0);
        tiYesterday.setCaloriesPer100g(52.0);
        tiYesterday.setProteinPer100g(0.3);
        tiYesterday.setCarbsPer100g(14.0);
        tiYesterday.setFatPer100g(0.2);
        tiYesterday.setTrackedDate(yesterday);
        trackedIngredientRepository.save(tiYesterday);

        TrackedIngredient tiToday = new TrackedIngredient();
        tiToday.setUser(testUser1);
        tiToday.setName("Banana");
        tiToday.setWeight(120.0);
        tiToday.setCaloriesPer100g(89.0);
        tiToday.setProteinPer100g(1.1);
        tiToday.setCarbsPer100g(22.8);
        tiToday.setFatPer100g(0.3);
        tiToday.setTrackedDate(today);
        trackedIngredientRepository.save(tiToday);

        TrackedIngredient tiTomorrow = new TrackedIngredient();
        tiTomorrow.setUser(testUser1);
        tiTomorrow.setName("Orange");
        tiTomorrow.setWeight(150.0);
        tiTomorrow.setCaloriesPer100g(47.0);
        tiTomorrow.setProteinPer100g(0.9);
        tiTomorrow.setCarbsPer100g(11.8);
        tiTomorrow.setFatPer100g(0.1);
        tiTomorrow.setTrackedDate(tomorrow);
        trackedIngredientRepository.save(tiTomorrow);

        // Fetch the range from yesterday to tomorrow
        mockMvc.perform(get("/api/v1/tracker?start=" + yesterday + "&end=" + tomorrow)
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[*].name", containsInAnyOrder("Apple", "Banana", "Orange")));
    }
}
