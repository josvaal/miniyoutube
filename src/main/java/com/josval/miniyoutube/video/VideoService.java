package com.josval.miniyoutube.video;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.user.UserRepository;
import com.josval.miniyoutube.video.dto.UploadVideoRequest;
import com.josval.miniyoutube.video.dto.VideoResponse;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoService {

  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final VideoProcessingService videoProcessingService;

  /**
   * Listar videos públicos completados, paginado y ordenado por fecha más reciente
   */
  public Page<VideoResponse> listPublicVideos(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<VideoEntity> videos = videoRepository.findByPrivacyStatusAndProcessingStatus(
        VideoPrivacyStatus.PUBLIC,
        VideoProcessingStatus.COMPLETED,
        pageable
    );

    return videos.map(this::mapToResponse);
  }

  /**
   * Listar videos de un usuario específico (incluyendo privados si es el creador)
   */
  public Page<VideoResponse> listUserVideos(String userId, int page, int size) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<VideoEntity> videos = videoRepository.findByCreator(user, pageable);

    return videos.map(this::mapToResponse);
  }

  /**
   * Subir un video
   */
  public VideoResponse uploadVideo(String userEmail, UploadVideoRequest request, MultipartFile videoFile) {
    // Validar que se envió un archivo
    if (videoFile == null || videoFile.isEmpty()) {
      throw new RuntimeException("Debe proporcionar un archivo de video");
    }

    // Buscar usuario
    UserEntity creator = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    // Crear entidad de video
    VideoEntity video = new VideoEntity();
    video.setCreator(creator);
    video.setTitle(request.getTitle());
    video.setDescription(request.getDescription());
    video.setPrivacyStatus(request.getPrivacyStatus() != null ? request.getPrivacyStatus() : VideoPrivacyStatus.PRIVATE);
    video.setTags(request.getTags());
    video.setViews_count(0);
    video.setLikes_count(0);
    video.setDislikes_count(0);
    video.setCreatedAt(new Date());

    // Guardar video en BD con estado inicial
    video = videoRepository.save(video);

    log.info("Video creado con ID: {}, iniciando procesamiento asíncrono", video.getId());

    try {
      // Guardar archivo temporalmente
      java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("upload-" + video.getId() + "-", getFileExtension(videoFile.getOriginalFilename()));
      videoFile.transferTo(tempFile.toFile());

      // Marcar como PROCESSING (aún no hay calidades disponibles)
      video.setProcessingStatus(VideoProcessingStatus.PROCESSING);
      video.setAvailableQualities(new java.util.ArrayList<>());
      videoRepository.save(video);

      log.info("Video guardado, procesamiento iniciado en background: {}", video.getId());

      // Iniciar procesamiento incremental de TODAS las calidades en background (asíncrono)
      videoProcessingService.processAllQualitiesIncremental(video.getId(), tempFile.toString());

    } catch (Exception e) {
      log.error("Error guardando video: {}", e.getMessage(), e);
      video.setProcessingStatus(VideoProcessingStatus.FAILED);
      videoRepository.save(video);
    }

    return mapToResponse(video);
  }

  private String getFileExtension(String filename) {
    if (filename == null) return "";
    int lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : "";
  }

  /**
   * Obtener información de un video por ID
   */
  public VideoResponse getVideoById(String videoId) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    // Incrementar contador de vistas
    video.setViews_count(video.getViews_count() != null ? video.getViews_count() + 1 : 1);
    videoRepository.save(video);

    return mapToResponse(video);
  }

  /**
   * Verificar si un usuario puede ver un video (privacidad)
   */
  public boolean canUserAccessVideo(VideoEntity video, String userEmail) {
    if (video.getPrivacyStatus() == VideoPrivacyStatus.PUBLIC) {
      return true;
    }

    if (userEmail == null) {
      return false;
    }

    UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
    if (user == null) {
      return false;
    }

    // Solo el creador puede ver videos privados
    return video.getCreator().getId().equals(user.getId());
  }

  /**
   * Mapear VideoEntity a VideoResponse
   */
  private VideoResponse mapToResponse(VideoEntity video) {
    VideoResponse response = new VideoResponse();
    response.setId(video.getId());
    response.setCreatorId(video.getCreator().getId());
    response.setCreatorChannelName(video.getCreator().getChannelName());
    response.setCreatorAvatarUrl(video.getCreator().getAvatarURL());
    response.setTitle(video.getTitle());
    response.setDescription(video.getDescription());
    response.setPrivacyStatus(video.getPrivacyStatus());
    response.setVideoUrl(video.getVideoUrl());
    response.setThumbnailUrl(video.getThumbnailUrl());
    response.setDuration_sec(video.getDuration_sec());
    response.setTags(video.getTags());
    response.setViews_count(video.getViews_count());
    response.setLikes_count(video.getLikes_count());
    response.setDislikes_count(video.getDislikes_count());
    response.setProcessingStatus(video.getProcessingStatus());
    response.setHlsManifestUrl(video.getHlsManifestUrl());
    response.setAvailableQualities(video.getAvailableQualities());
    response.setCreatedAt(video.getCreatedAt());
    return response;
  }
}
