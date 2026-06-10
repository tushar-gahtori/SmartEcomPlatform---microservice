package com.example.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private String message;
    private T data;
    private int status;

    public ApiResponse(String message, T data) {
        this.message = message;
        this.data = data;
        this.status = 200;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(message, data, 200);
    }

    public static <T> ApiResponse<T> created(String message, T data) {
        return new ApiResponse<>(message, data, 201);
    }

    public static <T> ApiResponse<T> error(String message, int status) {
        return new ApiResponse<>(message, null, status);
    }
}