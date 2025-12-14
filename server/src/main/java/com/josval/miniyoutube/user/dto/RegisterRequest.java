package com.josval.miniyoutube.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
  @NotBlank(message = "El username es obligatorio")
  private String username;

  @NotBlank(message = "El email es obligatorio")
  @Email(message = "El email no es valido")
  private String email;

  @NotBlank(message = "La contrasena es obligatoria")
  @Size(min = 8, message = "La contrasena debe tener al menos 8 caracteres")
  private String password;

  @NotBlank(message = "El nombre del canal es obligatorio")
  private String channelName;
}
