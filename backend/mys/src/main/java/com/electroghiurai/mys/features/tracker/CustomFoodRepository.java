package com.electroghiurai.mys.features.tracker;

import com.electroghiurai.mys.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Data access for CustomFood.
 */
@Repository
public interface CustomFoodRepository extends JpaRepository<CustomFood, UUID> {
    List<CustomFood> findByUser(User user);
    List<CustomFood> findByUserAndNameContainingIgnoreCase(User user, String name);
}
