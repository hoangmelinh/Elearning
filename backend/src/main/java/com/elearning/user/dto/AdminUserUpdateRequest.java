package com.elearning.user.dto;

import com.elearning.user.UserRole;
import com.elearning.user.UserStatus;
import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    private UserRole role;
    private UserStatus status;
}
