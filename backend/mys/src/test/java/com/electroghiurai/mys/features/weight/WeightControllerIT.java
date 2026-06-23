package com.electroghiurai.mys.features.weight;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.UserRepository;
import com.electroghiurai.mys.features.auth.JwtService;
import com.electroghiurai.mys.features.weight.WeightDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class WeightControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WeightLogRepository weightLogRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser1;
    private User testUser2;
    private String tokenUser1;
    private String tokenUser2;

    @BeforeEach
    void setUp() {
        weightLogRepository.deleteAll();
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

        // Generate token for user 2
        tokenUser2 = jwtService.generateAccessToken(testUser2);
    }

    private String toJson(LogWeightRequest req) {
        return """
                {
                    "weightKg": %s,
                    "loggedDate": "%s"
                }
                """.formatted(req.weightKg(), req.loggedDate().toString());
    }

    @Test
    void endpoints_withoutAuth_return401() throws Exception {
        mockMvc.perform(get("/api/v1/weights"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/weights")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(80.5, LocalDate.now()))))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/v1/weights/" + UUID.randomUUID()))
                .andExpect(status().isForbidden());
    }

    @Test
    void logWeight_withAuth_succeeds() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 23);
        LogWeightRequest logReq = new LogWeightRequest(78.5, date);

        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(logReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.weightKg", is(78.5)))
                .andExpect(jsonPath("$.data.loggedDate", is("2026-06-23")))
                .andExpect(jsonPath("$.data.id", notNullValue()));
    }

    @Test
    void logWeight_invalidInput_returnsBadRequest() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 23);
        
        // Weight too low (< 20.0)
        LogWeightRequest lowReq = new LogWeightRequest(19.9, date);
        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(lowReq)))
                .andExpect(status().isBadRequest());

        // Weight too high (> 300.0)
        LogWeightRequest highReq = new LogWeightRequest(301.0, date);
        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(highReq)))
                .andExpect(status().isBadRequest());

        // Future date (must be past or present)
        LocalDate futureDate = LocalDate.now().plusDays(1);
        LogWeightRequest futureReq = new LogWeightRequest(80.0, futureDate);
        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(futureReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteWeight_nonExistent_returnsNotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/weights/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")));
    }

    @Test
    void logWeight_duplicateDate_updatesExisting() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 23);
        LogWeightRequest firstReq = new LogWeightRequest(78.5, date);
        LogWeightRequest secondReq = new LogWeightRequest(77.2, date);

        // Log first
        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(firstReq)))
                .andExpect(status().isCreated());

        // Log second (updates first)
        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(secondReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.weightKg", is(77.2)));

        // Retrieve and check list has exactly 1 item
        mockMvc.perform(get("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].weightKg", is(77.2)));
    }

    @Test
    void getWeights_returnsChronologicalOrder() throws Exception {
        LocalDate date1 = LocalDate.of(2026, 6, 20);
        LocalDate date2 = LocalDate.of(2026, 6, 22);
        LocalDate date3 = LocalDate.of(2026, 6, 21);

        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(80.0, date1))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(81.0, date2))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(80.5, date3))))
                .andExpect(status().isCreated());

        // Retrieve
        mockMvc.perform(get("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(3)))
                // Should be sorted chronologically: date1 (20th), date3 (21st), date2 (22nd)
                .andExpect(jsonPath("$.data[0].loggedDate", is("2026-06-20")))
                .andExpect(jsonPath("$.data[1].loggedDate", is("2026-06-21")))
                .andExpect(jsonPath("$.data[2].loggedDate", is("2026-06-22")));
    }

    @Test
    void deleteWeight_succeeds() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 23);
        String responseStr = mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(78.5, date))))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(responseStr).path("data").path("id").asText();

        // Delete
        mockMvc.perform(delete("/api/v1/weights/" + id)
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isNoContent());

        // Check empty
        mockMvc.perform(get("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    void deleteWeight_ofAnotherUser_returnsForbidden() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 23);
        String responseStr = mockMvc.perform(post("/api/v1/weights")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(new LogWeightRequest(78.5, date))))
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(responseStr).path("data").path("id").asText();

        // Delete using user 2 token
        mockMvc.perform(delete("/api/v1/weights/" + id)
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isForbidden());
    }
}
