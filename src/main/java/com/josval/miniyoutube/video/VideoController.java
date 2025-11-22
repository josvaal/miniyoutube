package com.josval.miniyoutube.video;

import com.josval.miniyoutube.video.dto.UploadVideoRequest;
import com.josval.miniyoutube.video.dto.VideoResponse;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
@Tag(name = "Videos", description = "Endpoints para gestión de videos")
public class VideoController {

  private final VideoService videoService;

  @Operation(
      summary = "Listar videos públicos",
      description = "Obtiene una lista paginada de videos públicos completados, ordenados por fecha más reciente"
  )
  @GetMapping
  public ResponseEntity<Page<VideoResponse>> listPublicVideos(
      @Parameter(description = "Número de página (empezando en 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size
  ) {
    Page<VideoResponse> videos = videoService.listPublicVideos(page, size);
    return ResponseEntity.ok(videos);
  }

  @Operation(
      summary = "Subir video",
      description = "Sube un nuevo video. El video se procesa de forma asíncrona para generar streaming HLS con múltiples calidades y thumbnail automático."
  )
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<VideoResponse> uploadVideo(
      @Parameter(description = "Título del video (requerido)") @RequestPart("title") String title,
      @Parameter(description = "Descripción del video (opcional)") @RequestPart(value = "description", required = false) String description,
      @Parameter(description = "Estado de privacidad (PUBLIC, PRIVATE, UNLISTED)") @RequestPart(value = "privacyStatus", required = false) String privacyStatus,
      @Parameter(description = "Tags del video separados por comas (opcional)") @RequestPart(value = "tags", required = false) String tags,
      @Parameter(description = "Archivo de video (formatos: MP4, AVI, MOV, WebM, max 500MB)") @RequestPart("video") MultipartFile video
  ) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    // Construir request
    UploadVideoRequest request = new UploadVideoRequest();
    request.setTitle(title);
    request.setDescription(description);

    // Parsear privacyStatus
    if (privacyStatus != null) {
      try {
        request.setPrivacyStatus(VideoPrivacyStatus.valueOf(privacyStatus.toUpperCase()));
      } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().build();
      }
    }

    // Parsear tags
    if (tags != null && !tags.trim().isEmpty()) {
      request.setTags(java.util.Arrays.asList(tags.split(",")));
    }

    VideoResponse response = videoService.uploadVideo(userEmail, request, video);
    return ResponseEntity.ok(response);
  }

  @Operation(
      summary = "Ver video",
      description = "Obtiene la información de un video específico, incluyendo URL del manifest HLS para streaming. Incrementa el contador de vistas."
  )
  @GetMapping("/{id}")
  public ResponseEntity<VideoResponse> getVideo(
      @Parameter(description = "ID del video") @PathVariable String id
  ) {
    try {
      VideoResponse video = videoService.getVideoById(id);
      return ResponseEntity.ok(video);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @Operation(
      summary = "Listar mis videos",
      description = "Obtiene una lista paginada de todos los videos del usuario autenticado"
  )
  @GetMapping("/my-videos")
  public ResponseEntity<Page<VideoResponse>> listMyVideos(
      @Parameter(description = "Número de página (empezando en 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size
  ) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    // Obtener el ID del usuario desde el email
    // Nota: Esto requeriría una modificación en VideoService para aceptar email en vez de userId
    // Por ahora, retornaremos not implemented
    return ResponseEntity.status(501).build();
  }
}
