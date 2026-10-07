package com.zestora.common;

import org.springframework.http.HttpStatus;

/** A business-rule failure that maps directly to an HTTP status and a stable error code. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus status() { return status; }
    public String code() { return code; }

    public static ApiException badRequest(String message) { return new ApiException(HttpStatus.BAD_REQUEST, "BAD_REQUEST", message); }
    public static ApiException unauthorized(String message) { return new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message); }
    public static ApiException forbidden(String message) { return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", message); }
    public static ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", message); }
    public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message); }
}
