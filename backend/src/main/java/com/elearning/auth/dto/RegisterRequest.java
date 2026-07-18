package com.elearning.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    @NotBlank
    @JsonProperty("full_name")
    private String fullName;
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 8)
    private String password;
    
    private String phone;
}
