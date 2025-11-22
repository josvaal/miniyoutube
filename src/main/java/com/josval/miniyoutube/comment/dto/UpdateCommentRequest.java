package com.josval.miniyoutube.comment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Solicitud para actualizar un comentario")
public class UpdateCommentRequest {

  @NotBlank(message = "El cuerpo del comentario es requerido")
  @Schema(description = "Nuevo contenido del comentario", example = "¡Excelente video! (editado)")
  private String body;
}
