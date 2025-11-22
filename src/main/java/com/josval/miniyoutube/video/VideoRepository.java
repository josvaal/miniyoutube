package com.josval.miniyoutube.video;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoRepository extends MongoRepository<VideoEntity, String> {

  // Listar videos públicos completados, paginado
  Page<VideoEntity> findByPrivacyStatusAndProcessingStatus(
      VideoPrivacyStatus privacyStatus,
      VideoProcessingStatus processingStatus,
      Pageable pageable
  );

  // Listar videos de un usuario específico
  Page<VideoEntity> findByCreator(UserEntity creator, Pageable pageable);

  // Buscar video por ID con validación adicional
  Optional<VideoEntity> findById(String id);

  // Verificar si existe video por ID
  boolean existsById(String id);
}
