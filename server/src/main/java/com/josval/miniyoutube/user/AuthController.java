package com.josval.miniyoutube.user;

import com.josval.miniyoutube.user.dto.LoginRequest;
import com.josval.miniyoutube.user.dto.LoginResponse;
import com.josval.miniyoutube.user.dto.RegisterRequest;
import com.josval.miniyoutube.user.dto.UserResponse;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final UserService userService;

  @PostMapping("/register")
  public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
    UserResponse response = userService.register(request);
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "Inicio de sesion", description = "Inicio de sesion con correo y contraseña")
  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    LoginResponse response = userService.login(request);
    return ResponseEntity.ok(response);
  }
}
