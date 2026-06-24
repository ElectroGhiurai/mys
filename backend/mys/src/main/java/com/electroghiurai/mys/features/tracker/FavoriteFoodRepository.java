package com.electroghiurai.mys.features.tracker;

import com.electroghiurai.mys.features.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Data access for FavoriteFood.
 */
@Repository
public interface FavoriteFoodRepository extends JpaRepository<FavoriteFood, UUID> {
    List<FavoriteFood> findByUser(User user);
    Optional<FavoriteFood> findByUserAndNameIgnoreCase(User user, String name);
}
