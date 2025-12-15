package com.josval.miniyoutube.comment;

import com.josval.miniyoutube.comment.dto.CommentResponse;
import com.josval.miniyoutube.comment.dto.CreateCommentRequest;
import com.josval.miniyoutube.comment.dto.UpdateCommentRequest;
import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.user.UserRepository;
import com.josval.miniyoutube.video.VideoEntity;
import com.josval.miniyoutube.video.VideoRepository;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

  private final CommentRepository commentRepository;
  private final VideoRepository videoRepository;
  private final UserRepository userRepository;

  /**
   * Crear un comentario en un video
   */
  public CommentResponse createComment(String videoId, String userEmail, CreateCommentRequest request) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    if (!canUserAccessVideo(video, user)) {
      throw new RuntimeException("No tienes permiso para comentar en este video");
    }

    // Si es una respuesta, validar que existe el comentario padre
    CommentEntity parent = null;
    if (request.getParentId() != null && !request.getParentId().isEmpty()) {
      parent = commentRepository.findById(request.getParentId())
          .orElseThrow(() -> new RuntimeException("Comentario padre no encontrado"));

      // Validar que el comentario padre pertenece al mismo video
      if (!parent.getVideo().getId().equals(videoId)) {
        throw new RuntimeException("El comentario padre no pertenece a este video");
      }
    }

    // Crear comentario
    CommentEntity comment = new CommentEntity();
    comment.setVideo(video);
    comment.setUser(user);
    comment.setBody(request.getBody());
    comment.setParent(parent);
    comment.setCreatedAt(new Date());

    comment = commentRepository.save(comment);

    log.info("Comentario creado con ID: {} para el video: {}", comment.getId(), videoId);

    return mapToResponse(comment);
  }

  /**
   * Listar comentarios principales de un video (scroll infinito)
   * Solo muestra comentarios principales con contador de respuestas
   */
  public Page<CommentResponse> listVideoComments(String videoId, String userEmail, int page, int size) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    UserEntity user = null;
    if (userEmail != null) {
      user = userRepository.findByEmail(userEmail).orElse(null);
    }

    if (!canUserAccessVideo(video, user)) {
      throw new RuntimeException("No tienes permiso para ver los comentarios de este video");
    }

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

    Page<CommentEntity> comments = commentRepository.findByVideoAndParentIsNull(video, pageable);

    return comments.map(this::mapToResponse);
  }

  /**
   * Listar respuestas de un comentario (scroll infinito)
   * Se llama cuando el usuario hace click en "Ver respuestas"
   */
  public Page<CommentResponse> listCommentReplies(String commentId, String userEmail, int page, int size) {
    CommentEntity parent = commentRepository.findById(commentId)
        .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

    UserEntity user = null;
    if (userEmail != null) {
      user = userRepository.findByEmail(userEmail).orElse(null);
    }

    if (!canUserAccessVideo(parent.getVideo(), user)) {
      throw new RuntimeException("No tienes permiso para ver los comentarios de este video");
    }

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));

    Page<CommentEntity> replies = commentRepository.findByParentOrderByCreatedAtAsc(parent, pageable);

    return replies.map(this::mapToResponse);
  }

  /**
   * Obtener un comentario específico
   */
  public CommentResponse getComment(String commentId) {
    CommentEntity comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

    return mapToResponse(comment);
  }

  /**
   * Actualizar un comentario
   */
  public CommentResponse updateComment(String commentId, String userEmail, UpdateCommentRequest request) {
    CommentEntity comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    // Verificar que el usuario sea el dueño del comentario
    if (!comment.getUser().getId().equals(user.getId())) {
      throw new RuntimeException("No tienes permiso para editar este comentario");
    }

    comment.setBody(request.getBody());
    comment = commentRepository.save(comment);

    log.info("Comentario actualizado: {}", commentId);

    return mapToResponse(comment);
  }

  /**
   * Eliminar un comentario y todas sus respuestas recursivamente
   * Solo el dueño del comentario puede eliminarlo
   */
  public void deleteComment(String commentId, String userEmail) {
    CommentEntity comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new RuntimeException("Comentario no encontrado"));

    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    // Verificar que el usuario sea el dueño del comentario
    if (!comment.getUser().getId().equals(user.getId())) {
      throw new RuntimeException("No tienes permiso para eliminar este comentario");
    }

    // Eliminar el comentario y todas sus respuestas recursivamente
    deleteCommentAndReplies(comment);

    log.info("Comentario eliminado: {} (con todas sus respuestas)", commentId);
  }

  /**
   * Eliminar un comentario y todas sus respuestas recursivamente
   */
  private void deleteCommentAndReplies(CommentEntity comment) {
    // Obtener todas las respuestas directas
    List<CommentEntity> replies = commentRepository.findByParent(comment);

    // Eliminar recursivamente todas las respuestas
    for (CommentEntity reply : replies) {
      deleteCommentAndReplies(reply);
    }

    // Eliminar el comentario
    commentRepository.delete(comment);
  }

  /**
   * Mapear CommentEntity a CommentResponse
   * Incluye el contador de respuestas
   */
  private CommentResponse mapToResponse(CommentEntity comment) {
    CommentResponse response = new CommentResponse();
    response.setId(comment.getId());
    response.setVideoId(comment.getVideo().getId());
    response.setUserId(comment.getUser().getId());
    response.setUsername(comment.getUser().getUsername());
    response.setUserChannelName(comment.getUser().getChannelName());
    response.setUserAvatarUrl(comment.getUser().getAvatarURL());
    response.setBody(comment.getBody());
    response.setParentId(comment.getParent() != null ? comment.getParent().getId() : null);
    response.setCreatedAt(comment.getCreatedAt());

    // Contar respuestas solo si es un comentario principal
    if (comment.getParent() == null) {
      response.setRepliesCount(commentRepository.countByParent(comment));
    } else {
      response.setRepliesCount(0L);
    }

    return response;
  }

  private boolean canUserAccessVideo(VideoEntity video, UserEntity user) {
    if (video.getPrivacyStatus() == VideoPrivacyStatus.PUBLIC
        || video.getPrivacyStatus() == VideoPrivacyStatus.UNLISTED) {
      return true;
    }

    return user != null && video.getCreator().getId().equals(user.getId());
  }
}
