package com.elearning.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class FileSizeValidationFilter extends OncePerRequestFilter {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String contentType = request.getContentType();
        if (contentType != null && contentType.toLowerCase().startsWith("multipart/form-data")) {
            long contentLength = request.getContentLengthLong();
            if (contentLength > MAX_FILE_SIZE) {
                response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Payload Too Large: File size exceeds the 10MB limit\"}");
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
