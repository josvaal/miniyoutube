package com.josval.miniyoutube.video;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.ReactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoReactionRepository extends MongoRepository<VideoReaction, String> {

  // Buscar reacción de un usuario en un video
  Optional<VideoReaction> findByUserAndVideo(UserEntity user, VideoEntity video);

  // Verificar si existe una reacción
  boolean existsByUserAndVideo(UserEntity user, VideoEntity video);

  // Eliminar reacción de un usuario en un video
  void deleteByUserAndVideo(UserEntity user, VideoEntity video);

  // Reacciones por usuario y tipo (para "me gusta")
  Page<VideoReaction> findByUserAndType(UserEntity user, ReactionType type, Pageable pageable);
}
