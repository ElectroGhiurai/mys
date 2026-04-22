package com.electroghiurai.mys.features.fitness;

import org.springframework.stereotype.Service;
import com.electroghiurai.mys.features.auth.User;

@Service
public class FitnessService {
    private final FitnessRepository fitnessRepository;

    public FitnessService(FitnessRepository fitnessRepository) {
        this.fitnessRepository = fitnessRepository;
    }

    public FitnessProfile getFitnessProfileForUser(User user) {
        return fitnessRepository.findByUser(user).orElse(null);
    }

    public FitnessProfile saveFitnessProfile(FitnessProfile profile) {
        return fitnessRepository.save(profile);
    }
}
