package com.josval.miniyoutube.video;

import com.josval.miniyoutube.comment.dto.CommentResponse;
import com.josval.miniyoutube.comment.dto.CreateCommentRequest;
import com.josval.miniyoutube.video.dto.UploadVideoRequest;
import com.josval.miniyoutube.video.dto.VideoResponse;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
public class VideoController {

  private final VideoService videoService;
  private final com.josval.miniyoutube.comment.CommentService commentService;

  @GetMapping
  public ResponseEntity<Page<VideoResponse>> listPublicVideos(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {
    // Obtener usuario autenticado si existe
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = null;
    if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
      userEmail = authentication.getName();
    }

    Page<VideoResponse> videos = videoService.listPublicVideos(userEmail, page, size);
    return ResponseEntity.ok(videos);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<VideoResponse> uploadVideo(
      @Parameter(description = "Título del video (requerido)") @RequestPart("title") String title,
      @Parameter(description = "Descripción del video (opcional)") @RequestPart(value = "description", required = false) String description,
      @Parameter(description = "Estado de privacidad (PUBLIC, PRIVATE, UNLISTED)") @RequestPart(value = "privacyStatus", required = false) String privacyStatus,
      @Parameter(description = "Tags del video separados por comas (opcional)") @RequestPart(value = "tags", required = false) String tags,
      @Parameter(description = "Archivo de video (formatos: MP4, AVI, MOV, WebM, max 500MB)") @RequestPart("video") MultipartFile video) {
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

  @GetMapping("/{id}")
  public ResponseEntity<VideoResponse> getVideo(
      @Parameter(description = "ID del video") @PathVariable String id) {
    try {
      // Obtener usuario autenticado (puede ser null si no está autenticado)
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      String userEmail = null;
      if (authentication != null && authentication.isAuthenticated()
          && !"anonymousUser".equals(authentication.getPrincipal())) {
        userEmail = authentication.getName();
      }

      VideoResponse video = videoService.getVideoById(id, userEmail);
      return ResponseEntity.ok(video);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/my-videos")
  public ResponseEntity<Page<VideoResponse>> listMyVideos(
      @Parameter(description = "Número de página (empezando en 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    // Obtener el ID del usuario desde el email
    // Nota: Esto requeriría una modificación en VideoService para aceptar email en
    // vez de userId
    // Por ahora, retornaremos not implemented
    return ResponseEntity.status(501).build();
  }

  @PostMapping("/{videoId}/comments")
  public ResponseEntity<CommentResponse> createComment(
      @Parameter(description = "ID del video") @PathVariable String videoId,
      @Valid @RequestBody CreateCommentRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    CommentResponse comment = commentService.createComment(videoId, userEmail, request);
    return ResponseEntity.ok(comment);
  }

  @GetMapping("/{videoId}/comments")
  public ResponseEntity<Page<CommentResponse>> listVideoComments(
      @PathVariable String videoId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Page<CommentResponse> comments = commentService.listVideoComments(videoId, page, size);
    return ResponseEntity.ok(comments);
  }

  @PostMapping("/{videoId}/like")
  public ResponseEntity<Void> likeVideo(@PathVariable String videoId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    try {
      videoService.likeVideo(videoId, userEmail);
      return ResponseEntity.ok().build();
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping("/{videoId}/dislike")
  public ResponseEntity<Void> dislikeVideo(@PathVariable String videoId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    try {
      videoService.dislikeVideo(videoId, userEmail);
      return ResponseEntity.ok().build();
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @DeleteMapping("/{videoId}/reaction")
  public ResponseEntity<Void> removeReaction(@PathVariable String videoId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    try {
      videoService.removeReaction(videoId, userEmail);
      return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().build();
    }
  }
}
