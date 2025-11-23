package com.josval.miniyoutube.subscription;

import com.josval.miniyoutube.subscription.dto.SubscriptionResponse;
import com.josval.miniyoutube.subscription.dto.SubscriptionStatusResponse;
import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

  private final SubscriptionRepository subscriptionRepository;
  private final UserRepository userRepository;

  /**
   * Suscribirse a un canal
   */
  public SubscriptionStatusResponse subscribe(String channelId, String userEmail) {
    UserEntity subscriber = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    UserEntity channel = userRepository.findById(channelId)
        .orElseThrow(() -> new RuntimeException("Canal no encontrado"));

    // No permitir suscribirse a sí mismo
    if (subscriber.getId().equals(channel.getId())) {
      throw new RuntimeException("No puedes suscribirte a tu propio canal");
    }

    // Verificar si ya está suscrito
    if (subscriptionRepository.existsBySubscriberAndChannel(subscriber, channel)) {
      throw new RuntimeException("Ya estás suscrito a este canal");
    }

    // Crear suscripción
    SubscriptionEntity subscription = new SubscriptionEntity();
    subscription.setSubscriber(subscriber);
    subscription.setChannel(channel);
    subscriptionRepository.save(subscription);

    log.info("Usuario {} se suscribió al canal {}", subscriber.getUsername(), channel.getUsername());

    return getSubscriptionStatus(channelId, userEmail);
  }

  /**
   * Desuscribirse de un canal
   */
  public SubscriptionStatusResponse unsubscribe(String channelId, String userEmail) {
    UserEntity subscriber = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    UserEntity channel = userRepository.findById(channelId)
        .orElseThrow(() -> new RuntimeException("Canal no encontrado"));

    // Buscar la suscripción
    SubscriptionEntity subscription = subscriptionRepository.findBySubscriberAndChannel(subscriber, channel)
        .orElseThrow(() -> new RuntimeException("No estás suscrito a este canal"));

    // Eliminar suscripción
    subscriptionRepository.delete(subscription);

    log.info("Usuario {} se desuscribió del canal {}", subscriber.getUsername(), channel.getUsername());

    return getSubscriptionStatus(channelId, userEmail);
  }

  /**
   * Verificar estado de suscripción a un canal
   */
  public SubscriptionStatusResponse getSubscriptionStatus(String channelId, String userEmail) {
    UserEntity channel = userRepository.findById(channelId)
        .orElseThrow(() -> new RuntimeException("Canal no encontrado"));

    boolean isSubscribed = false;

    if (userEmail != null) {
      UserEntity subscriber = userRepository.findByEmail(userEmail).orElse(null);
      if (subscriber != null) {
        isSubscribed = subscriptionRepository.existsBySubscriberAndChannel(subscriber, channel);
      }
    }

    long subscriberCount = subscriptionRepository.countByChannel(channel);

    return new SubscriptionStatusResponse(isSubscribed, subscriberCount);
  }

  /**
   * Listar canales a los que está suscrito un usuario (mis suscripciones)
   */
  public Page<SubscriptionResponse> getUserSubscriptions(String userEmail, int page, int size) {
    UserEntity user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

    Page<SubscriptionEntity> subscriptions = subscriptionRepository.findBySubscriber(user, pageable);

    return subscriptions.map(subscription -> mapToResponse(subscription.getChannel()));
  }

  /**
   * Listar suscriptores de un canal
   */
  public Page<SubscriptionResponse> getChannelSubscribers(String channelId, int page, int size) {
    UserEntity channel = userRepository.findById(channelId)
        .orElseThrow(() -> new RuntimeException("Canal no encontrado"));

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));

    Page<SubscriptionEntity> subscriptions = subscriptionRepository.findByChannel(channel, pageable);

    return subscriptions.map(subscription -> mapToResponse(subscription.getSubscriber()));
  }

  /**
   * Mapear UserEntity a SubscriptionResponse
   */
  private SubscriptionResponse mapToResponse(UserEntity user) {
    SubscriptionResponse response = new SubscriptionResponse();
    response.setChannelId(user.getId());
    response.setUsername(user.getUsername());
    response.setChannelName(user.getChannelName());
    response.setAvatarUrl(user.getAvatarURL());
    response.setSubscriberCount(subscriptionRepository.countByChannel(user));
    return response;
  }
}
