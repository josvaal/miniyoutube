package com.josval.miniyoutube.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {

  @Schema(description = "Email del usuario", example = "josval.personal@gmail.com")
  @NotBlank(message = "El email es obligatorio")
  @Email(message = "El email no es valido")
  private String email;

  @Schema(description = "Contrasena del usuario", example = "15022004")
  @NotBlank(message = "La contrasena es obligatoria")
  private String password;
}
