package com.elearning.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordRequest {
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    private String otp_code;
    
    @NotBlank
    @Size(min = 8)
    private String new_password;
}
