package com.zestora.review;

import com.zestora.catalog.Restaurant;
import com.zestora.catalog.RestaurantRepository;
import com.zestora.common.ApiException;
import com.zestora.common.ApiResponse;
import com.zestora.order.Order;
import com.zestora.order.OrderRepository;
import com.zestora.order.OrderStatus;
import com.zestora.security.AuthUser;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor
class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private Long customerId;
    private Long restaurantId;
    private int foodRating;
    private Integer packagingRating;
    private Integer deliveryRating;
    private String comment;
    private String reply;
    private Instant createdAt = Instant.now();
}

interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByOrderId(Long orderId);

    List<Review> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    @Query("select avg(r.foodRating), count(r) from Review r where r.restaurantId = :rid")
    List<Object[]> stats(Long rid);
}

@Service
class ReviewService {
    private final ReviewRepository reviews;
    private final OrderRepository orders;
    private final RestaurantRepository restaurants;

    ReviewService(ReviewRepository reviews, OrderRepository orders, RestaurantRepository restaurants) {
        this.reviews = reviews;
        this.orders = orders;
        this.restaurants = restaurants;
    }

    @Transactional
    public Review create(AuthUser user, ReviewController.CreateRequest req) {
        Order o = orders.findById(req.orderId()).filter(x -> x.getCustomerId().equals(user.id()))
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (o.getStatus() != OrderStatus.DELIVERED) throw ApiException.conflict("You can review an order after it is delivered");
        if (reviews.existsByOrderId(o.getId())) throw ApiException.conflict("This order has already been reviewed");
        Review r = new Review();
        r.setOrderId(o.getId());
        r.setCustomerId(user.id());
        r.setRestaurantId(o.getRestaurantId());
        r.setFoodRating(req.foodRating());
        r.setPackagingRating(req.packagingRating());
        r.setDeliveryRating(req.deliveryRating());
        r.setComment(req.comment());
        reviews.saveAndFlush(r);
        if (o.getRestaurantId() != null) refreshRating(o.getRestaurantId());
        return r;
    }

    @Transactional
    public Review reply(AuthUser user, Long reviewId, String reply) {
        Review r = reviews.findById(reviewId).orElseThrow(() -> ApiException.notFound("Review not found"));
        Restaurant mine = restaurants.findByOwnerId(user.id()).orElseThrow(() -> ApiException.forbidden("No restaurant linked"));
        if (!mine.getId().equals(r.getRestaurantId())) throw ApiException.notFound("Review not found");
        r.setReply(reply);
        return r;
    }

    private void refreshRating(Long restaurantId) {
        Object[] row = reviews.stats(restaurantId).get(0);
        Restaurant rest = restaurants.findById(restaurantId).orElseThrow();
        rest.setRating(BigDecimal.valueOf(((Number) row[0]).doubleValue()).setScale(2, RoundingMode.HALF_UP));
        rest.setReviewCount(((Number) row[1]).intValue());
    }

    @Transactional(readOnly = true)
    public List<Review> forRestaurant(Long id) {
        return reviews.findByRestaurantIdOrderByCreatedAtDesc(id);
    }
}

@RestController
@RequestMapping("/api/v1")
class ReviewController {
    record CreateRequest(@NotNull Long orderId, @Min(1) @Max(5) int foodRating, @Min(1) @Max(5) Integer packagingRating,
                         @Min(1) @Max(5) Integer deliveryRating, @Size(max = 1000) String comment) {}

    record ReplyRequest(@NotBlank @Size(max = 1000) String reply) {}

    record ReviewDto(Long id, Long orderId, int foodRating, Integer packagingRating, Integer deliveryRating,
                     String comment, String reply, Instant createdAt) {
        static ReviewDto of(Review r) {
            return new ReviewDto(r.getId(), r.getOrderId(), r.getFoodRating(), r.getPackagingRating(), r.getDeliveryRating(),
                    r.getComment(), r.getReply(), r.getCreatedAt());
        }
    }

    private final ReviewService service;

    ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping("/reviews")
    ApiResponse<ReviewDto> create(@Valid @RequestBody CreateRequest req) {
        return ApiResponse.ok(ReviewDto.of(service.create(AuthUser.current(), req)));
    }

    /** Public (no customer identity is exposed). */
    @GetMapping("/restaurants/{id}/reviews")
    ApiResponse<List<ReviewDto>> list(@PathVariable Long id) {
        return ApiResponse.ok(service.forRestaurant(id).stream().map(ReviewDto::of).toList());
    }

    @PatchMapping("/partner/reviews/{id}/reply")
    ApiResponse<ReviewDto> reply(@PathVariable Long id, @Valid @RequestBody ReplyRequest req) {
        return ApiResponse.ok(ReviewDto.of(service.reply(AuthUser.current(), id, req.reply())));
    }
}
