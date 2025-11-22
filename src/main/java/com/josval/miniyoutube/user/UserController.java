package com.josval.miniyoutube.user;

import com.josval.miniyoutube.user.dto.UpdateUserRequest;
import com.josval.miniyoutube.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final UserRepository userRepository;

  @GetMapping("/me")
  public ResponseEntity<UserResponse> getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String email = authentication.getName();

    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    UserResponse response = userService.getUserById(user.getId());
    return ResponseEntity.ok(response);
  }

  @Operation(summary = "Actualizar usuario actual", description = "Actualiza los datos del usuario autenticado, incluyendo avatar")
  @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<UserResponse> updateCurrentUser(
      @Parameter(description = "Nombre de usuario (opcional)") @RequestPart(value = "username", required = false) String username,
      @Parameter(description = "Email del usuario (opcional)") @RequestPart(value = "email", required = false) String email,
      @Parameter(description = "Nombre del canal (opcional)") @RequestPart(value = "channelName", required = false) String channelName,
      @Parameter(description = "Imagen de avatar (opcional)") @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String currentEmail = authentication.getName();

    // Crear request con los datos proporcionados
    UpdateUserRequest request = new UpdateUserRequest();
    request.setUsername(username);
    request.setEmail(email);
    request.setChannelName(channelName);

    UserResponse response = userService.updateCurrentUser(currentEmail, request, avatar);
    return ResponseEntity.ok(response);
  }
}
