package com.zestora.catalog;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByRestaurantIdOrderByCategoryAscNameAsc(Long restaurantId);

    @Query("""
            select p from Product p
            where p.grocery = true
              and (:category = '' or p.category = :category)
              and lower(p.name) like :pattern
            order by p.category, p.name
            """)
    /** {@code category} is "" for all; {@code pattern} is a lower-cased LIKE pattern. Never pass null (PostgreSQL types it as bytea). */
    List<Product> searchGrocery(@Param("category") String category, @Param("pattern") String pattern);

    /** Row-level lock so two concurrent orders cannot oversell the same grocery stock. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids order by p.id")
    List<Product> lockAllById(@Param("ids") Collection<Long> ids);
}
