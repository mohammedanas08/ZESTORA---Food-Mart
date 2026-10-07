package com.zestora.common;

/** Standard response envelope: {success, data} or {success:false, error:{code,message}}. */
public record ApiResponse<T>(boolean success, T data, ErrorBody error) {

    public record ErrorBody(String code, String message) {}

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static ApiResponse<Void> fail(String code, String message) {
        return new ApiResponse<>(false, null, new ErrorBody(code, message));
    }
}
