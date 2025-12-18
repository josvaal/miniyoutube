package com.josval.miniyoutube.user;

import com.josval.miniyoutube.subscription.SubscriptionService;
import com.josval.miniyoutube.subscription.dto.SubscriptionResponse;
import com.josval.miniyoutube.subscription.dto.SubscriptionStatusResponse;
import com.josval.miniyoutube.user.dto.UpdateUserRequest;
import com.josval.miniyoutube.user.dto.UserResponse;
import com.josval.miniyoutube.video.VideoService;
import com.josval.miniyoutube.video.dto.HistoryItemResponse;
import com.josval.miniyoutube.video.dto.VideoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final UserRepository userRepository;
  private final SubscriptionService subscriptionService;
  private final VideoService videoService;

  @GetMapping("/me")
  public ResponseEntity<UserResponse> getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String email = authentication.getName();

    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    UserResponse response = userService.getUserById(user.getId());
    return ResponseEntity.ok(response);
  }

  @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<UserResponse> updateCurrentUser(
      @RequestPart(value = "username", required = false) String username,
      @RequestPart(value = "email", required = false) String email,
      @RequestPart(value = "channelName", required = false) String channelName,
      @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String currentEmail = authentication.getName();

    // Crear request con los datos proporcionados
    UpdateUserRequest request = new UpdateUserRequest();
    request.setUsername(username);
    request.setEmail(email);
    request.setChannelName(channelName);

    UserResponse response = userService.updateCurrentUser(currentEmail, request, avatar);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/me/history")
  public ResponseEntity<Page<HistoryItemResponse>> getMyHistory(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    Page<HistoryItemResponse> history = videoService.getUserHistory(userEmail, page, size);
    return ResponseEntity.ok(history);
  }

  @GetMapping("/me/liked")
  public ResponseEntity<Page<VideoResponse>> getMyLikedVideos(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    Page<VideoResponse> liked = videoService.getLikedVideos(userEmail, page, size);
    return ResponseEntity.ok(liked);
  }

  @PostMapping("/{userId}/subscribe")
  public ResponseEntity<SubscriptionStatusResponse> subscribe(@PathVariable String userId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    try {
      SubscriptionStatusResponse response = subscriptionService.subscribe(userId, userEmail);
      return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @DeleteMapping("/{userId}/subscribe")
  public ResponseEntity<SubscriptionStatusResponse> unsubscribe(@PathVariable String userId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    try {
      SubscriptionStatusResponse response = subscriptionService.unsubscribe(userId, userEmail);
      return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @GetMapping("/{userId}/subscription")
  public ResponseEntity<SubscriptionStatusResponse> getSubscriptionStatus(@PathVariable String userId) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = null;
    if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
      userEmail = authentication.getName();
    }

    try {
      SubscriptionStatusResponse response = subscriptionService.getSubscriptionStatus(userId, userEmail);
      return ResponseEntity.ok(response);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @GetMapping("/me/subscriptions")
  public ResponseEntity<Page<SubscriptionResponse>> getMySubscriptions(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    Page<SubscriptionResponse> subscriptions = subscriptionService.getUserSubscriptions(userEmail, page, size);
    return ResponseEntity.ok(subscriptions);
  }

  @GetMapping("/{userId}/subscribers")
  public ResponseEntity<Page<SubscriptionResponse>> getChannelSubscribers(
      @PathVariable String userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    try {
      Page<SubscriptionResponse> subscribers = subscriptionService.getChannelSubscribers(userId, page, size);
      return ResponseEntity.ok(subscribers);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }
}
