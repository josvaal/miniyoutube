package com.josval.miniyoutube.video.dto;

import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Collection;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Request para subir un video")
public class UploadVideoRequest {

  @Schema(description = "Título del video", example = "Mi primer video", required = true)
  private String title;

  @Schema(description = "Descripción del video", example = "Este es un video de prueba")
  private String description;

  @Schema(description = "Estado de privacidad", example = "PUBLIC", required = true)
  private VideoPrivacyStatus privacyStatus;

  @Schema(description = "Tags del video", example = "[\"tutorial\", \"programación\"]")
  private Collection<String> tags;
}
