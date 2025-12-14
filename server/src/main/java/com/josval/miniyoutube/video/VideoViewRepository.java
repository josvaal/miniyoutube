package com.josval.miniyoutube.video;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VideoViewRepository extends MongoRepository<VideoView, String> {

  /**
   * Verificar si un usuario ya vio un video específico
   */
  boolean existsByUserIdAndVideoId(String userId, String videoId);

  /**
   * Obtener la vista de un usuario para un video específico
   */
  Optional<VideoView> findByUserIdAndVideoId(String userId, String videoId);
}
