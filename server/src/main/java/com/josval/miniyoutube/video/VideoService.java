package com.josval.miniyoutube.video;

import com.josval.miniyoutube.subscription.SubscriptionEntity;
import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.user.UserRepository;
import com.josval.miniyoutube.video.dto.UploadVideoRequest;
import com.josval.miniyoutube.video.dto.VideoResponse;
import com.josval.miniyoutube.video.enums.ReactionType;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoService {

  private final VideoRepository videoRepository;
  private final UserRepository userRepository;
  private final VideoProcessingService videoProcessingService;
  private final VideoViewRepository videoViewRepository;
  private final com.josval.miniyoutube.subscription.SubscriptionRepository subscriptionRepository;
  private final VideoReactionRepository videoReactionRepository;

  /**
   * Listar videos públicos completados, paginado y ordenado por fecha más reciente
   * Si el usuario está autenticado, muestra primero videos de canales suscritos
   */
  public Page<VideoResponse> listPublicVideos(String userEmail, int page, int size) {
    // Si no hay usuario autenticado, retornar todos los videos públicos normalmente
    if (userEmail == null) {
      Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
      Page<VideoEntity> videos = videoRepository.findByPrivacyStatusAndProcessingStatus(
          VideoPrivacyStatus.PUBLIC,
          VideoProcessingStatus.COMPLETED,
          pageable
      );
      return videos.map(this::mapToResponse);
    }

    // Usuario autenticado: priorizar videos de suscripciones
    UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
    if (user == null) {
      // Si no se encuentra el usuario, retornar videos normales
      Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
      Page<VideoEntity> videos = videoRepository.findByPrivacyStatusAndProcessingStatus(
          VideoPrivacyStatus.PUBLIC,
          VideoProcessingStatus.COMPLETED,
          pageable
      );
      return videos.map(this::mapToResponse);
    }

    // Obtener IDs de canales suscritos
    List<SubscriptionEntity> subscriptions = subscriptionRepository.findBySubscriber(
        user,
        PageRequest.of(0, 1000) // Limite razonable de suscripciones
    ).getContent();

    Set<String> subscribedChannelIds = subscriptions.stream()
        .map(sub -> sub.getChannel().getId())
        .collect(Collectors.toSet());

    // Si no tiene suscripciones, retornar videos normales
    if (subscribedChannelIds.isEmpty()) {
      Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
      Page<VideoEntity> videos = videoRepository.findByPrivacyStatusAndProcessingStatus(
          VideoPrivacyStatus.PUBLIC,
          VideoProcessingStatus.COMPLETED,
          pageable
      );
      return videos.map(this::mapToResponse);
    }

    // Obtener TODOS los videos públicos (necesario para ordenar correctamente)
    // Para paginación eficiente, obtenemos más de lo necesario
    int totalToFetch = (page + 2) * size; // Obtener suficientes para esta página y la siguiente
    Pageable fetchPageable = PageRequest.of(0, totalToFetch, Sort.by(Sort.Direction.DESC, "createdAt"));
    List<VideoEntity> allVideos = videoRepository.findByPrivacyStatusAndProcessingStatus(
        VideoPrivacyStatus.PUBLIC,
        VideoProcessingStatus.COMPLETED,
        fetchPageable
    ).getContent();

    // Separar videos de suscripciones y otros
    List<VideoEntity> subscribedVideos = new ArrayList<>();
    List<VideoEntity> otherVideos = new ArrayList<>();

    for (VideoEntity video : allVideos) {
      if (subscribedChannelIds.contains(video.getCreator().getId())) {
        subscribedVideos.add(video);
      } else {
        otherVideos.add(video);
      }
    }

    // Combinar: primero videos de suscripciones, luego otros
    List<VideoEntity> sortedVideos = new ArrayList<>();
    sortedVideos.addAll(subscribedVideos);
    sortedVideos.addAll(otherVideos);

    // Aplicar paginación manual
    int start = page * size;
    int end = Math.min(start + size, sortedVideos.size());

    if (start >= sortedVideos.size()) {
      return new PageImpl<>(Collections.emptyList(), PageRequest.of(page, size), sortedVideos.size());
    }

    List<VideoEntity> pageContent = sortedVideos.subList(start, end);
    List<VideoResponse> responseContent = pageContent.stream()
        .map(this::mapToResponse)
        .collect(Collectors.toList());

    return new PageImpl<>(responseContent, PageRequest.of(page, size), sortedVideos.size());
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
   * Solo incrementa el contador de vistas si el usuario no ha visto el video antes
   */
  public VideoResponse getVideoById(String videoId, String userEmail) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    // Solo incrementar vistas si el usuario está autenticado y no ha visto el video antes
    if (userEmail != null) {
      UserEntity user = userRepository.findByEmail(userEmail).orElse(null);

      if (user != null) {
        String userId = user.getId();

        // Verificar si el usuario ya vio este video
        boolean alreadyViewed = videoViewRepository.existsByUserIdAndVideoId(userId, videoId);

        if (!alreadyViewed) {
          // Registrar la vista
          VideoView view = new VideoView(userId, videoId);
          videoViewRepository.save(view);

          // Incrementar contador de vistas
          video.setViews_count(video.getViews_count() != null ? video.getViews_count() + 1 : 1);
          videoRepository.save(video);
        }
      }
    }

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

  /**
   * Dar like a un video
   * Si ya tiene like, lo remueve. Si tiene dislike, lo cambia a like.
   */
  @Transactional
  public void likeVideo(String videoId, String userEmail) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Optional<VideoReaction> existingReaction = videoReactionRepository.findByUserAndVideo(user, video);

    if (existingReaction.isPresent()) {
      VideoReaction reaction = existingReaction.get();

      if (reaction.getType() == ReactionType.LIKE) {
        // Ya tiene like, removerlo
        videoReactionRepository.delete(reaction);
        video.setLikes_count(Math.max(0, video.getLikes_count() - 1));
        log.info("Usuario {} removió like del video {}", user.getUsername(), videoId);
      } else {
        // Tiene dislike, cambiar a like
        reaction.setType(ReactionType.LIKE);
        videoReactionRepository.save(reaction);
        video.setDislikes_count(Math.max(0, video.getDislikes_count() - 1));
        video.setLikes_count(video.getLikes_count() + 1);
        log.info("Usuario {} cambió dislike a like en video {}", user.getUsername(), videoId);
      }
    } else {
      // No tiene reacción, crear like
      VideoReaction reaction = new VideoReaction();
      reaction.setVideo(video);
      reaction.setUser(user);
      reaction.setType(ReactionType.LIKE);
      videoReactionRepository.save(reaction);
      video.setLikes_count(video.getLikes_count() + 1);
      log.info("Usuario {} dio like al video {}", user.getUsername(), videoId);
    }

    videoRepository.save(video);
  }

  /**
   * Dar dislike a un video
   * Si ya tiene dislike, lo remueve. Si tiene like, lo cambia a dislike.
   */
  @Transactional
  public void dislikeVideo(String videoId, String userEmail) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Optional<VideoReaction> existingReaction = videoReactionRepository.findByUserAndVideo(user, video);

    if (existingReaction.isPresent()) {
      VideoReaction reaction = existingReaction.get();

      if (reaction.getType() == ReactionType.DISLIKE) {
        // Ya tiene dislike, removerlo
        videoReactionRepository.delete(reaction);
        video.setDislikes_count(Math.max(0, video.getDislikes_count() - 1));
        log.info("Usuario {} removió dislike del video {}", user.getUsername(), videoId);
      } else {
        // Tiene like, cambiar a dislike
        reaction.setType(ReactionType.DISLIKE);
        videoReactionRepository.save(reaction);
        video.setLikes_count(Math.max(0, video.getLikes_count() - 1));
        video.setDislikes_count(video.getDislikes_count() + 1);
        log.info("Usuario {} cambió like a dislike en video {}", user.getUsername(), videoId);
      }
    } else {
      // No tiene reacción, crear dislike
      VideoReaction reaction = new VideoReaction();
      reaction.setVideo(video);
      reaction.setUser(user);
      reaction.setType(ReactionType.DISLIKE);
      videoReactionRepository.save(reaction);
      video.setDislikes_count(video.getDislikes_count() + 1);
      log.info("Usuario {} dio dislike al video {}", user.getUsername(), videoId);
    }

    videoRepository.save(video);
  }

  /**
   * Remover reacción (like o dislike) de un video
   */
  @Transactional
  public void removeReaction(String videoId, String userEmail) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Optional<VideoReaction> existingReaction = videoReactionRepository.findByUserAndVideo(user, video);

    if (existingReaction.isPresent()) {
      VideoReaction reaction = existingReaction.get();

      if (reaction.getType() == ReactionType.LIKE) {
        video.setLikes_count(Math.max(0, video.getLikes_count() - 1));
      } else {
        video.setDislikes_count(Math.max(0, video.getDislikes_count() - 1));
      }

      videoReactionRepository.delete(reaction);
      videoRepository.save(video);

      log.info("Usuario {} removió su reacción del video {}", user.getUsername(), videoId);
    }
  }
}
