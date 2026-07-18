package com.elearning.user;

import com.elearning.common.ApiResponse;
import com.elearning.common.PagedResponse;
import com.elearning.user.dto.AdminUserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('admin')") // In Spring Security without role prefix mapped, we might need adjustments
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<User>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<User> users = adminUserService.getAllUsers(search, role, status, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(users)));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable UUID userId) {
        User user = adminUserService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable UUID userId,
            @RequestBody AdminUserUpdateRequest request
    ) {
        User user = adminUserService.updateUserStatusOrRole(userId, request.getRole(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable UUID userId) {
        adminUserService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
