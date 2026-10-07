package com.zestora.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByOwnerId(Long ownerId);

    @Query("""
            select r from Restaurant r
            where r.active = true
              and (:vegOnly = false or r.vegOnly = true)
              and (lower(r.name) like :pattern or lower(coalesce(r.cuisines, '')) like :pattern)
            order by r.rating desc
            """)
    /** {@code pattern} is a lower-cased LIKE pattern (never null — a null bind is typed as bytea by PostgreSQL). */
    List<Restaurant> search(@Param("pattern") String pattern, @Param("vegOnly") boolean vegOnly);
}
