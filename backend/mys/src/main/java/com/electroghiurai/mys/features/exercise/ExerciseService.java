package com.electroghiurai.mys.features.exercise;

import com.electroghiurai.mys.features.auth.User;
import com.electroghiurai.mys.features.exercise.ExerciseDtos.*;
import com.electroghiurai.mys.features.auth.AuthExceptions.AccessDeniedException;
import com.electroghiurai.mys.common.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service to handle business logic for gym exercise and progress tracking.
 */
@Service
public class ExerciseService {

    private static final Logger log = LoggerFactory.getLogger(ExerciseService.class);
    private final ExerciseLogRepository exerciseLogRepository;

    public ExerciseService(ExerciseLogRepository exerciseLogRepository) {
        this.exerciseLogRepository = exerciseLogRepository;
    }

    @Transactional(readOnly = true)
    public List<ExerciseLogDto> getExercises(User user) {
        log.info("Fetching exercise logs start: userId={}", user.getId());
        List<ExerciseLogDto> list = exerciseLogRepository.findByUserOrderByLoggedDateDesc(user)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
        log.info("Fetched {} exercise logs for userId={}", list.size(), user.getId());
        return list;
    }

    @Transactional
    public ExerciseLogDto logExercise(User user, LogExerciseRequest req) {
        log.info("Logging exercise start: userId={}, id={}, exerciseName={}, date={}",
                 user.getId(), req.id(), req.exerciseName(), req.loggedDate());

        ExerciseLog exerciseLog;
        if (req.id() != null) {
            log.debug("Updating existing exercise log: logId={}", req.id());
            exerciseLog = exerciseLogRepository.findById(req.id())
                .orElseThrow(() -> {
                    log.warn("Failed to update exercise log: log not found for logId={}", req.id());
                    return new ResourceNotFoundException("Exercise log not found");
                });

            if (!exerciseLog.getUser().getId().equals(user.getId())) {
                log.warn("Access denied: User={} tried to update exercise log={} belonging to User={}",
                         user.getId(), req.id(), exerciseLog.getUser().getId());
                throw new AccessDeniedException("Unauthorized update of exercise log");
            }

            exerciseLog.setExerciseName(req.exerciseName());
            exerciseLog.setCategory(req.category());
            exerciseLog.setLoggedDate(req.loggedDate());
            exerciseLog.clearSets();
        } else {
            log.debug("Creating new exercise log for userId={}", user.getId());
            exerciseLog = new ExerciseLog();
            exerciseLog.setUser(user);
            exerciseLog.setExerciseName(req.exerciseName());
            exerciseLog.setCategory(req.category());
            exerciseLog.setLoggedDate(req.loggedDate());
        }

        // Add new sets
        if (req.sets() != null) {
            for (LogExerciseSetRequest setReq : req.sets()) {
                ExerciseSet set = new ExerciseSet();
                set.setSetNumber(setReq.setNumber());
                set.setWeight(setReq.weight());
                set.setReps(setReq.reps());
                set.setDistanceKm(setReq.distanceKm());
                set.setDurationMinutes(setReq.durationMinutes());
                exerciseLog.addSet(set);
            }
        }

        ExerciseLog saved = exerciseLogRepository.save(exerciseLog);
        log.info("Logged exercise success: logId={}", saved.getId());
        return mapToDto(saved);
    }

    @Transactional
    public void deleteExercise(User user, UUID id) {
        log.info("Deleting exercise log start: userId={}, logId={}", user.getId(), id);
        ExerciseLog exerciseLog = exerciseLogRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Failed to delete exercise log: log not found for logId={}", id);
                return new ResourceNotFoundException("Exercise log not found");
            });

        if (!exerciseLog.getUser().getId().equals(user.getId())) {
            log.warn("Access denied: User={} tried to delete exercise log={} belonging to User={}",
                     user.getId(), id, exerciseLog.getUser().getId());
            throw new AccessDeniedException("Unauthorized deletion of exercise log");
        }

        exerciseLogRepository.delete(exerciseLog);
        log.info("Deleted exercise log success: logId={}", id);
    }

    private ExerciseLogDto mapToDto(ExerciseLog logEntity) {
        List<ExerciseSetDto> sets = logEntity.getSets().stream()
            .map(s -> new ExerciseSetDto(
                s.getId(),
                s.getSetNumber(),
                s.getWeight(),
                s.getReps(),
                s.getDistanceKm(),
                s.getDurationMinutes()
            ))
            .collect(Collectors.toList());

        return new ExerciseLogDto(
            logEntity.getId(),
            logEntity.getExerciseName(),
            logEntity.getCategory(),
            logEntity.getLoggedDate(),
            sets
        );
    }
}
