package com.josval.miniyoutube.subscription;

import com.josval.miniyoutube.user.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<SubscriptionEntity, String> {

  // Verificar si un usuario está suscrito a un canal
  boolean existsBySubscriberAndChannel(UserEntity subscriber, UserEntity channel);

  // Obtener la suscripción específica entre un usuario y un canal
  Optional<SubscriptionEntity> findBySubscriberAndChannel(UserEntity subscriber, UserEntity channel);

  // Listar suscripciones de un usuario (canales a los que está suscrito) - paginado
  Page<SubscriptionEntity> findBySubscriber(UserEntity subscriber, Pageable pageable);

  // Listar suscriptores de un canal - paginado
  Page<SubscriptionEntity> findByChannel(UserEntity channel, Pageable pageable);

  // Contar suscriptores de un canal
  long countByChannel(UserEntity channel);

  // Contar suscripciones de un usuario (a cuántos canales está suscrito)
  long countBySubscriber(UserEntity subscriber);
}
