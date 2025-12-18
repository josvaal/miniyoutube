package com.josval.miniyoutube.video;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface VideoViewRepository extends MongoRepository<VideoView, String> {

  /**
   * Verificar si un usuario ya vio un video específico
   */
  boolean existsByUserIdAndVideoId(String userId, String videoId);

  /**
   * Obtener la vista de un usuario para un video específico
   */
  Optional<VideoView> findByUserIdAndVideoId(String userId, String videoId);

  /**
   * Historial paginado de vistas de un usuario
   */
  Page<VideoView> findByUserIdOrderByViewedAtDesc(String userId, Pageable pageable);
}
