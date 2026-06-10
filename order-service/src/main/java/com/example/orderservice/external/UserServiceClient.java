package com.example.orderservice.external;

import com.example.common.dto.UserResponseDTO;
import com.example.common.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "USER-SERVICE")
public interface UserServiceClient {

    @GetMapping("/api/users/internal/by-email")
    ApiResponse<UserResponseDTO> getUserByEmail(@RequestParam("email") String email);
}