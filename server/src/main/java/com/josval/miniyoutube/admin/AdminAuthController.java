package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.security.AdminAuthenticationProvider;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAuthController {

  private final AdminAuthenticationProvider adminAuthenticationProvider;

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
      Authentication auth = adminAuthenticationProvider.authenticate(
          new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
      if (auth.isAuthenticated()) {
        return ResponseEntity.ok().body(java.util.Map.of("status", "ok"));
      }
    } catch (AuthenticationException e) {
      return ResponseEntity.status(401).body(java.util.Map.of("status", "unauthorized"));
    }
    return ResponseEntity.status(401).body(java.util.Map.of("status", "unauthorized"));
  }

  @Data
  public static class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
  }
}

