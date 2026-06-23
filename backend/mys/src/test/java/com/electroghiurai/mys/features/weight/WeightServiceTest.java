package com.electroghiurai.mys.features.weight;

import com.electroghiurai.mys.common.ResourceNotFoundException;
import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.auth.AuthExceptions.AccessDeniedException;
import com.electroghiurai.mys.features.weight.WeightDtos.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WeightServiceTest {

    private WeightLogRepository weightLogRepository;
    private WeightService weightService;
    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        weightLogRepository = mock(WeightLogRepository.class);
        weightService = new WeightService(weightLogRepository);

        userId = UUID.randomUUID();
        testUser = mock(User.class);
        when(testUser.getId()).thenReturn(userId);
    }

    @Test
    void getWeights_returnsMappedDtos() {
        // Arrange
        LocalDate date = LocalDate.of(2026, 6, 23);
        WeightLog log = new WeightLog();
        log.setId(UUID.randomUUID());
        log.setWeightKg(80.5);
        log.setLoggedDate(date);
        log.setUser(testUser);

        when(weightLogRepository.findByUserOrderByLoggedDateAsc(testUser)).thenReturn(List.of(log));

        // Act
        List<WeightLogDto> result = weightService.getWeights(testUser);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(80.5, result.get(0).weightKg());
        assertEquals(date, result.get(0).loggedDate());
    }

    @Test
    void logWeight_newEntry_createsAndSaves() {
        // Arrange
        LocalDate date = LocalDate.of(2026, 6, 23);
        LogWeightRequest req = new LogWeightRequest(78.5, date);

        when(weightLogRepository.findByUserAndLoggedDate(testUser, date)).thenReturn(Optional.empty());
        when(weightLogRepository.save(any(WeightLog.class))).thenAnswer(invocation -> {
            WeightLog arg = invocation.getArgument(0);
            arg.setId(UUID.randomUUID());
            return arg;
        });

        // Act
        WeightLogDto result = weightService.logWeight(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals(78.5, result.weightKg());
        assertEquals(date, result.loggedDate());
        verify(weightLogRepository).save(any(WeightLog.class));
    }

    @Test
    void logWeight_existingEntry_updatesAndSaves() {
        // Arrange
        LocalDate date = LocalDate.of(2026, 6, 23);
        LogWeightRequest req = new LogWeightRequest(77.2, date);

        WeightLog existing = new WeightLog();
        existing.setId(UUID.randomUUID());
        existing.setWeightKg(78.5);
        existing.setLoggedDate(date);
        existing.setUser(testUser);

        when(weightLogRepository.findByUserAndLoggedDate(testUser, date)).thenReturn(Optional.of(existing));
        when(weightLogRepository.save(existing)).thenReturn(existing);

        // Act
        WeightLogDto result = weightService.logWeight(testUser, req);

        // Assert
        assertNotNull(result);
        assertEquals(77.2, result.weightKg());
        assertEquals(date, result.loggedDate());
        verify(weightLogRepository).save(existing);
    }

    @Test
    void deleteWeight_owned_deletesSuccessfully() {
        // Arrange
        UUID logId = UUID.randomUUID();
        WeightLog log = new WeightLog();
        log.setId(logId);
        log.setUser(testUser);

        when(weightLogRepository.findById(logId)).thenReturn(Optional.of(log));

        // Act
        weightService.deleteWeight(testUser, logId);

        // Assert
        verify(weightLogRepository).delete(log);
    }

    @Test
    void deleteWeight_notOwned_throwsAccessDeniedException() {
        // Arrange
        UUID logId = UUID.randomUUID();
        WeightLog log = new WeightLog();
        log.setId(logId);

        User anotherUser = mock(User.class);
        when(anotherUser.getId()).thenReturn(UUID.randomUUID());
        log.setUser(anotherUser);

        when(weightLogRepository.findById(logId)).thenReturn(Optional.of(log));

        // Act & Assert
        assertThrows(AccessDeniedException.class, () -> weightService.deleteWeight(testUser, logId));
        verify(weightLogRepository, never()).delete(any());
    }

    @Test
    void deleteWeight_nonExistent_throwsResourceNotFoundException() {
        // Arrange
        UUID logId = UUID.randomUUID();
        when(weightLogRepository.findById(logId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> weightService.deleteWeight(testUser, logId));
        verify(weightLogRepository, never()).delete(any());
    }
}
