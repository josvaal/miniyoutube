package com.josval.miniyoutube.comment.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Respuesta con la información de un comentario")
public class CommentResponse {

  @Schema(description = "ID del comentario", example = "507f1f77bcf86cd799439011")
  private String id;

  @Schema(description = "ID del video", example = "507f1f77bcf86cd799439012")
  private String videoId;

  @Schema(description = "ID del usuario que creó el comentario", example = "507f1f77bcf86cd799439013")
  private String userId;

  @Schema(description = "Username del usuario que creó el comentario", example = "juanperez")
  private String username;

  @Schema(description = "Nombre del canal del usuario", example = "Canal de Juan")
  private String userChannelName;

  @Schema(description = "Avatar del usuario", example = "http://localhost:4566/miniyoutube/avatar/...")
  private String userAvatarUrl;

  @Schema(description = "Contenido del comentario", example = "¡Excelente video!")
  private String body;

  @Schema(description = "ID del comentario padre (si es una respuesta)", example = "507f1f77bcf86cd799439014", nullable = true)
  private String parentId;

  @Schema(description = "Fecha de creación del comentario", example = "2025-11-22T10:30:00Z")
  private Date createdAt;

  @Schema(description = "Número de respuestas a este comentario", example = "5")
  private Long repliesCount;
}
