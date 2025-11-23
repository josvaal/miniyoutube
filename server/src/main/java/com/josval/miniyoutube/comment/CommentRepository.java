package com.josval.miniyoutube.comment;

import com.josval.miniyoutube.video.VideoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends MongoRepository<CommentEntity, String> {

  // Listar comentarios de un video (solo comentarios principales, sin respuestas)
  Page<CommentEntity> findByVideoAndParentIsNull(VideoEntity video, Pageable pageable);

  // Listar respuestas a un comentario (paginado para scroll infinito)
  Page<CommentEntity> findByParentOrderByCreatedAtAsc(CommentEntity parent, Pageable pageable);

  // Listar todas las respuestas de un comentario (para eliminación recursiva)
  List<CommentEntity> findByParent(CommentEntity parent);

  // Contar comentarios de un video (solo principales)
  long countByVideoAndParentIsNull(VideoEntity video);

  // Contar respuestas de un comentario
  long countByParent(CommentEntity parent);
}
