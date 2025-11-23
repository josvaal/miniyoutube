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
@Schema(description = "Solicitud para crear un comentario")
public class CreateCommentRequest {

  @NotBlank(message = "El cuerpo del comentario es requerido")
  @Schema(description = "Contenido del comentario", example = "¡Excelente video!")
  private String body;

  @Schema(description = "ID del comentario padre (si es una respuesta)", example = "507f1f77bcf86cd799439011", nullable = true)
  private String parentId;
}
