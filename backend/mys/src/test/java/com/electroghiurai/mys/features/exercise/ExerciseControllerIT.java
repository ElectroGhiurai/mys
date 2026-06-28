package com.electroghiurai.mys.features.exercise;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.auth.JwtService;
import com.electroghiurai.mys.features.exercise.ExerciseDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ExerciseControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExerciseLogRepository exerciseLogRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser1;
    private User testUser2;
    private String tokenUser1;
    private String tokenUser2;

    private static boolean modulesRegistered = false;

    @BeforeEach
    void setUp() {
        if (!modulesRegistered) {
            objectMapper.findAndRegisterModules();
            modulesRegistered = true;
        }
        exerciseLogRepository.deleteAll();
        userRepository.deleteAll();

        // Create user 1
        testUser1 = new User();
        testUser1.setUsername("user_one");
        testUser1.setEmail("one@example.com");
        testUser1.setPasswordHash("hashedpassword");
        testUser1 = userRepository.save(testUser1);
        tokenUser1 = jwtService.generateAccessToken(testUser1);

        // Create user 2
        testUser2 = new User();
        testUser2.setUsername("user_two");
        testUser2.setEmail("two@example.com");
        testUser2.setPasswordHash("hashedpassword");
        testUser2 = userRepository.save(testUser2);
        tokenUser2 = jwtService.generateAccessToken(testUser2);
    }

    private String toJson(Object req) throws Exception {
        return objectMapper.writeValueAsString(req);
    }

    @Test
    void endpoints_withoutAuth_return403() throws Exception {
        mockMvc.perform(get("/api/v1/exercises"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/exercises")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/exercises/" + UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void logExercise_withAuth_succeeds() throws Exception {
        LogExerciseSetRequest set1 = new LogExerciseSetRequest(1, 80.0, 10, null, null);
        LogExerciseSetRequest set2 = new LogExerciseSetRequest(2, 85.0, 8, null, null);
        LogExerciseRequest req = new LogExerciseRequest(
                null, "Bench Press", "Chest", LocalDate.of(2026, 6, 23), List.of(set1, set2)
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.exerciseName", is("Bench Press")))
                .andExpect(jsonPath("$.data.category", is("Chest")))
                .andExpect(jsonPath("$.data.loggedDate", is("2026-06-23")))
                .andExpect(jsonPath("$.data.sets", hasSize(2)))
                .andExpect(jsonPath("$.data.sets[0].setNumber", is(1)))
                .andExpect(jsonPath("$.data.sets[0].weight", is(80.0)))
                .andExpect(jsonPath("$.data.sets[0].reps", is(10)))
                .andExpect(jsonPath("$.data.sets[1].setNumber", is(2)))
                .andExpect(jsonPath("$.data.sets[1].weight", is(85.0)))
                .andExpect(jsonPath("$.data.sets[1].reps", is(8)));
    }

    @Test
    void logExercise_blankName_returns400() throws Exception {
        LogExerciseSetRequest set = new LogExerciseSetRequest(1, 80.0, 10, null, null);
        LogExerciseRequest req = new LogExerciseRequest(
                null, "", "Chest", LocalDate.now(), List.of(set)
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void logExercise_emptySets_returns400() throws Exception {
        LogExerciseRequest req = new LogExerciseRequest(
                null, "Bench Press", "Chest", LocalDate.now(), List.of()
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getExercises_returnsUserSpecificLogs() throws Exception {
        // Create log for user 1
        ExerciseLog log1 = new ExerciseLog();
        log1.setUser(testUser1);
        log1.setExerciseName("Bench Press");
        log1.setCategory("Chest");
        log1.setLoggedDate(LocalDate.now());
        
        ExerciseSet set1 = new ExerciseSet();
        set1.setSetNumber(1);
        set1.setWeight(70.0);
        set1.setReps(10);
        log1.addSet(set1);
        exerciseLogRepository.save(log1);

        // Create log for user 2
        ExerciseLog log2 = new ExerciseLog();
        log2.setUser(testUser2);
        log2.setExerciseName("Deadlift");
        log2.setCategory("Back");
        log2.setLoggedDate(LocalDate.now());
        exerciseLogRepository.save(log2);

        // Fetch logs for user 1
        mockMvc.perform(get("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].exerciseName", is("Bench Press")))
                .andExpect(jsonPath("$.data[0].sets", hasSize(1)));
    }

    @Test
    void updateExercise_ofSelf_succeeds() throws Exception {
        ExerciseLog log = new ExerciseLog();
        log.setUser(testUser1);
        log.setExerciseName("Bench Press");
        log.setCategory("Chest");
        log.setLoggedDate(LocalDate.now());
        
        ExerciseSet set = new ExerciseSet();
        set.setSetNumber(1);
        set.setWeight(70.0);
        set.setReps(10);
        log.addSet(set);
        log = exerciseLogRepository.save(log);

        LogExerciseSetRequest setReq = new LogExerciseSetRequest(1, 90.0, 12, null, null);
        LogExerciseRequest req = new LogExerciseRequest(
                log.getId(), "Incline Bench Press", "Chest", LocalDate.now(), List.of(setReq)
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id", is(log.getId().toString())))
                .andExpect(jsonPath("$.data.exerciseName", is("Incline Bench Press")))
                .andExpect(jsonPath("$.data.sets[0].weight", is(90.0)));
    }

    @Test
    void updateExercise_ofAnotherUser_returns403() throws Exception {
        ExerciseLog log = new ExerciseLog();
        log.setUser(testUser2);
        log.setExerciseName("Deadlift");
        log.setCategory("Back");
        log.setLoggedDate(LocalDate.now());
        log = exerciseLogRepository.save(log);

        LogExerciseSetRequest setReq = new LogExerciseSetRequest(1, 150.0, 5, null, null);
        LogExerciseRequest req = new LogExerciseRequest(
                log.getId(), "Deadlift", "Back", LocalDate.now(), List.of(setReq)
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteExercise_ofSelf_succeeds() throws Exception {
        ExerciseLog log = new ExerciseLog();
        log.setUser(testUser1);
        log.setExerciseName("Bench Press");
        log.setCategory("Chest");
        log.setLoggedDate(LocalDate.now());
        log = exerciseLogRepository.save(log);

        mockMvc.perform(delete("/api/v1/exercises/" + log.getId())
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", empty()));
    }

    @Test
    void deleteExercise_ofAnotherUser_returns403() throws Exception {
        ExerciseLog log = new ExerciseLog();
        log.setUser(testUser2);
        log.setExerciseName("Deadlift");
        log.setCategory("Back");
        log.setLoggedDate(LocalDate.now());
        log = exerciseLogRepository.save(log);

        mockMvc.perform(delete("/api/v1/exercises/" + log.getId())
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateExercise_nonExistentId_returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        LogExerciseSetRequest setReq = new LogExerciseSetRequest(1, 90.0, 12, null, null);
        LogExerciseRequest req = new LogExerciseRequest(
                nonExistentId, "Bench Press", "Chest", LocalDate.now(), List.of(setReq)
        );

        mockMvc.perform(post("/api/v1/exercises")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteExercise_nonExistentId_returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/exercises/" + nonExistentId)
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNotFound());
    }
}
