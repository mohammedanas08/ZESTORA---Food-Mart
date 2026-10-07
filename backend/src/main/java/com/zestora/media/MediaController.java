package com.zestora.media;

import com.zestora.common.ApiException;
import com.zestora.common.ApiResponse;
import com.zestora.config.AppProperties;
import com.zestora.security.AuthUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

/**
 * Cloudinary signed uploads: the browser uploads straight to Cloudinary using a short-lived signature from here,
 * so the API secret never leaves the server. Only restaurant staff and admins may upload; folders are fixed.
 */
@RestController
@RequestMapping("/api/v1/media")
public class MediaController {
    public record SignRequest(@Pattern(regexp = "restaurants|products|avatars") String folder) {}

    private final AppProperties.Cloudinary cfg;

    public MediaController(AppProperties props) {
        this.cfg = props.cloudinary();
    }

    @PostMapping("/sign")
    public ApiResponse<Map<String, Object>> sign(@Valid @RequestBody SignRequest req) {
        AuthUser user = AuthUser.current();
        if (!(user.role().isAdmin() || user.role().isRestaurantStaff() || "avatars".equals(req.folder()))) {
            throw ApiException.forbidden("You cannot upload to this folder");
        }
        if (!cfg.configured()) throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_NOT_CONFIGURED", "Image uploads are not configured");

        long timestamp = Instant.now().getEpochSecond();
        String folder = "zestora/" + (req.folder() == null ? "products" : req.folder());
        // Cloudinary signature: SHA-1 of the alphabetically sorted params + API secret.
        String toSign = "folder=" + folder + "&timestamp=" + timestamp + cfg.apiSecret();
        return ApiResponse.ok(Map.of(
                "cloudName", cfg.cloudName(),
                "apiKey", cfg.apiKey(),
                "timestamp", timestamp,
                "folder", folder,
                "signature", sha1(toSign)));
    }

    private static String sha1(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
