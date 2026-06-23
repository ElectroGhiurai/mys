package com.electroghiurai.mys.features.weight;

import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.weight.WeightDtos.*;
import com.electroghiurai.mys.features.auth.AuthExceptions.AccessDeniedException;
import com.electroghiurai.mys.common.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service to handle business logic for weight tracking.
 */
@Service
public class WeightService {

    private static final Logger log = LoggerFactory.getLogger(WeightService.class);
    private final WeightLogRepository weightLogRepository;

    public WeightService(WeightLogRepository weightLogRepository) {
        this.weightLogRepository = weightLogRepository;
    }

    @Transactional(readOnly = true)
    public List<WeightLogDto> getWeights(User user) {
        List<WeightLogDto> list = weightLogRepository.findByUserOrderByLoggedDateAsc(user)
            .stream()
            .map(item -> new WeightLogDto(item.getId(), item.getWeightKg(), item.getLoggedDate()))
            .collect(Collectors.toList());
        log.info("Fetched {} weight logs for userId={}", list.size(), user.getId());
        return list;
    }

    @Transactional
    public WeightLogDto logWeight(User user, LogWeightRequest req) {
        log.info("Logging weight start: userId={}, date={}", user.getId(), req.loggedDate());
        Optional<WeightLog> existingLogOpt = weightLogRepository.findByUserAndLoggedDate(user, req.loggedDate());
        WeightLog weightLog;
        if (existingLogOpt.isPresent()) {
            log.debug("Updating existing weight log for userId={}, date={}", user.getId(), req.loggedDate());
            weightLog = existingLogOpt.get();
            weightLog.setWeightKg(req.weightKg());
        } else {
            log.debug("Creating new weight log for userId={}, date={}", user.getId(), req.loggedDate());
            weightLog = new WeightLog();
            weightLog.setUser(user);
            weightLog.setLoggedDate(req.loggedDate());
            weightLog.setWeightKg(req.weightKg());
        }

        WeightLog saved = weightLogRepository.save(weightLog);
        log.info("Logged weight success: logId={}", saved.getId());
        return new WeightLogDto(saved.getId(), saved.getWeightKg(), saved.getLoggedDate());
    }

    @Transactional
    public void deleteWeight(User user, UUID id) {
        log.info("Deleting weight log start: userId={}, logId={}", user.getId(), id);
        WeightLog weightLog = weightLogRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Failed to delete weight log: log not found for logId={}", id);
                return new ResourceNotFoundException("Weight log not found");
            });

        if (!weightLog.getUser().getId().equals(user.getId())) {
            log.warn("Access denied: User={} tried to delete weight log={} belonging to User={}",
                     user.getId(), id, weightLog.getUser().getId());
            throw new AccessDeniedException("Unauthorized deletion of weight log");
        }

        weightLogRepository.delete(weightLog);
        log.info("Deleted weight log success: logId={}", id);
    }
}
