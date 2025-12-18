package com.josval.miniyoutube.video;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.ReactionType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoReactionRepository extends MongoRepository<VideoReaction, String> {

  // Buscar reacción de un usuario en un video
  Optional<VideoReaction> findByUserAndVideo(UserEntity user, VideoEntity video);

  // Verificar si existe una reacción
  boolean existsByUserAndVideo(UserEntity user, VideoEntity video);

  // Eliminar reacción de un usuario en un video
  void deleteByUserAndVideo(UserEntity user, VideoEntity video);

  // Listar reacciones por usuario y tipo (paginado)
  Page<VideoReaction> findByUserAndType(UserEntity user, ReactionType type, Pageable pageable);
}
