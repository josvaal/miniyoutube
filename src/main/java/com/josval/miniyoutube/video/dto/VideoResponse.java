package com.josval.miniyoutube.video.dto;

import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collection;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Respuesta con la información de un video")
public class VideoResponse {

  @Schema(description = "ID del video", example = "507f1f77bcf86cd799439011")
  private String id;

  @Schema(description = "ID del creador del video", example = "507f1f77bcf86cd799439012")
  private String creatorId;

  @Schema(description = "Nombre del canal del creador", example = "Mi Canal")
  private String creatorChannelName;

  @Schema(description = "Avatar del creador", example = "http://localhost:4566/miniyoutube/avatar/...")
  private String creatorAvatarUrl;

  @Schema(description = "Título del video", example = "Mi primer video")
  private String title;

  @Schema(description = "Descripción del video", example = "Este es un video de prueba")
  private String description;

  @Schema(description = "Estado de privacidad", example = "PUBLIC")
  private VideoPrivacyStatus privacyStatus;

  @Schema(description = "URL del video (HLS manifest después de procesar)", example = "http://localhost:4566/miniyoutube/videos/video-id/master.m3u8")
  private String videoUrl;

  @Schema(description = "URL del thumbnail", example = "http://localhost:4566/miniyoutube/thumbnails/...")
  private String thumbnailUrl;

  @Schema(description = "Duración en segundos", example = "180")
  private Integer duration_sec;

  @Schema(description = "Tags del video", example = "[\"tutorial\", \"programación\"]")
  private Collection<String> tags;

  @Schema(description = "Número de vistas", example = "1000")
  private Integer views_count;

  @Schema(description = "Número de likes", example = "50")
  private Integer likes_count;

  @Schema(description = "Número de dislikes", example = "5")
  private Integer dislikes_count;

  @Schema(description = "Estado de procesamiento", example = "COMPLETED")
  private VideoProcessingStatus processingStatus;

  @Schema(description = "URL del manifest HLS", example = "http://localhost:4566/miniyoutube/videos/video-id/master.m3u8")
  private String hlsManifestUrl;

  @Schema(description = "Calidades disponibles actualmente", example = "[\"360p\", \"480p\", \"720p\"]")
  private Collection<String> availableQualities;

  @Schema(description = "Fecha de creación", example = "2025-11-21T10:30:00Z")
  private Date createdAt;
}
