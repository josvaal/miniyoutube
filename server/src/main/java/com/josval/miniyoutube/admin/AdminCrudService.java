package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminCommentRequest;
import com.josval.miniyoutube.admin.dto.AdminReactionRequest;
import com.josval.miniyoutube.admin.dto.AdminSubscriptionRequest;
import com.josval.miniyoutube.admin.dto.AdminUserRequest;
import com.josval.miniyoutube.admin.dto.AdminVideoRequest;
import com.josval.miniyoutube.comment.CommentEntity;
import com.josval.miniyoutube.subscription.SubscriptionEntity;
import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.VideoEntity;
import com.josval.miniyoutube.video.VideoReaction;
import com.josval.miniyoutube.video.VideoView;
import java.util.Date;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminCrudService {

  @Qualifier("adminMongoTemplate")
  private final MongoTemplate adminMongoTemplate;
  private final PasswordEncoder passwordEncoder;

  public Page<UserEntity> listUsers(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), UserEntity.class);
    var users = adminMongoTemplate.find(query, UserEntity.class);
    return new PageImpl<>(users, pageable, total);
  }

  public UserEntity getUser(String id) {
    return adminMongoTemplate.findById(id, UserEntity.class);
  }

  public UserEntity createUser(AdminUserRequest request) {
    UserEntity user = new UserEntity();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(request.getPassword() != null ? passwordEncoder.encode(request.getPassword()) : null);
    user.setChannelName(request.getChannelName());
    user.setAvatarURL(request.getAvatarURL());
    user.setCreatedAt(Optional.ofNullable(request.getCreatedAt()).orElse(new Date()));
    return adminMongoTemplate.save(user);
  }

  public UserEntity updateUser(String id, AdminUserRequest request) {
    UserEntity user = adminMongoTemplate.findById(id, UserEntity.class);
    if (user == null) {
      return null;
    }
    if (request.getUsername() != null) user.setUsername(request.getUsername());
    if (request.getEmail() != null) user.setEmail(request.getEmail());
    if (request.getPassword() != null) user.setPassword(passwordEncoder.encode(request.getPassword()));
    if (request.getChannelName() != null) user.setChannelName(request.getChannelName());
    if (request.getAvatarURL() != null) user.setAvatarURL(request.getAvatarURL());
    if (request.getCreatedAt() != null) user.setCreatedAt(request.getCreatedAt());
    return adminMongoTemplate.save(user);
  }

  public void deleteUser(String id) {
    UserEntity user = adminMongoTemplate.findById(id, UserEntity.class);
    if (user != null) {
      adminMongoTemplate.remove(user);
    }
  }

  public Page<VideoEntity> listVideos(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), VideoEntity.class);
    var items = adminMongoTemplate.find(query, VideoEntity.class);
    return new PageImpl<>(items, pageable, total);
  }

  public VideoEntity getVideo(String id) {
    return adminMongoTemplate.findById(id, VideoEntity.class);
  }

  public VideoEntity createVideo(AdminVideoRequest request) {
    VideoEntity video = new VideoEntity();
    if (request.getCreatorId() != null) {
      UserEntity creator = adminMongoTemplate.findById(request.getCreatorId(), UserEntity.class);
      video.setCreator(creator);
    }
    applyVideoFields(video, request);
    video.setCreatedAt(Optional.ofNullable(request.getCreatedAt()).orElse(new Date()));
    return adminMongoTemplate.save(video);
  }

  public VideoEntity updateVideo(String id, AdminVideoRequest request) {
    VideoEntity video = adminMongoTemplate.findById(id, VideoEntity.class);
    if (video == null) {
      return null;
    }
    if (request.getCreatorId() != null) {
      UserEntity creator = adminMongoTemplate.findById(request.getCreatorId(), UserEntity.class);
      video.setCreator(creator);
    }
    applyVideoFields(video, request);
    if (request.getCreatedAt() != null) {
      video.setCreatedAt(request.getCreatedAt());
    }
    return adminMongoTemplate.save(video);
  }

  public void deleteVideo(String id) {
    VideoEntity video = adminMongoTemplate.findById(id, VideoEntity.class);
    if (video != null) {
      adminMongoTemplate.remove(video);
    }
  }

  private void applyVideoFields(VideoEntity video, AdminVideoRequest request) {
    if (request.getTitle() != null) video.setTitle(request.getTitle());
    if (request.getDescription() != null) video.setDescription(request.getDescription());
    if (request.getPrivacyStatus() != null) video.setPrivacyStatus(request.getPrivacyStatus());
    if (request.getVideoUrl() != null) video.setVideoUrl(request.getVideoUrl());
    if (request.getThumbnailUrl() != null) video.setThumbnailUrl(request.getThumbnailUrl());
    if (request.getDurationSec() != null) video.setDuration_sec(request.getDurationSec());
    if (request.getTags() != null) video.setTags(request.getTags());
    if (request.getViewsCount() != null) video.setViews_count(request.getViewsCount());
    if (request.getLikesCount() != null) video.setLikes_count(request.getLikesCount());
    if (request.getDislikesCount() != null) video.setDislikes_count(request.getDislikesCount());
    if (request.getProcessingStatus() != null) video.setProcessingStatus(request.getProcessingStatus());
    if (request.getHlsManifestUrl() != null) video.setHlsManifestUrl(request.getHlsManifestUrl());
    if (request.getOriginalVideoUrl() != null) video.setOriginalVideoUrl(request.getOriginalVideoUrl());
    if (request.getAvailableQualities() != null) video.setAvailableQualities(request.getAvailableQualities());
  }

  public Page<CommentEntity> listComments(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), CommentEntity.class);
    var items = adminMongoTemplate.find(query, CommentEntity.class);
    return new PageImpl<>(items, pageable, total);
  }

  public CommentEntity getComment(String id) {
    return adminMongoTemplate.findById(id, CommentEntity.class);
  }

  public CommentEntity createComment(AdminCommentRequest request) {
    CommentEntity comment = new CommentEntity();
    if (request.getVideoId() != null) {
      VideoEntity video = adminMongoTemplate.findById(request.getVideoId(), VideoEntity.class);
      comment.setVideo(video);
    }
    if (request.getUserId() != null) {
      UserEntity user = adminMongoTemplate.findById(request.getUserId(), UserEntity.class);
      comment.setUser(user);
    }
    if (request.getParentId() != null) {
      CommentEntity parent = adminMongoTemplate.findById(request.getParentId(), CommentEntity.class);
      comment.setParent(parent);
    }
    comment.setBody(request.getBody());
    comment.setCreatedAt(Optional.ofNullable(request.getCreatedAt()).orElse(new Date()));
    return adminMongoTemplate.save(comment);
  }

  public CommentEntity updateComment(String id, AdminCommentRequest request) {
    CommentEntity comment = adminMongoTemplate.findById(id, CommentEntity.class);
    if (comment == null) {
      return null;
    }
    if (request.getBody() != null) comment.setBody(request.getBody());
    if (request.getVideoId() != null) {
      VideoEntity video = adminMongoTemplate.findById(request.getVideoId(), VideoEntity.class);
      comment.setVideo(video);
    }
    if (request.getUserId() != null) {
      UserEntity user = adminMongoTemplate.findById(request.getUserId(), UserEntity.class);
      comment.setUser(user);
    }
    if (request.getParentId() != null) {
      CommentEntity parent = adminMongoTemplate.findById(request.getParentId(), CommentEntity.class);
      comment.setParent(parent);
    }
    if (request.getCreatedAt() != null) comment.setCreatedAt(request.getCreatedAt());
    return adminMongoTemplate.save(comment);
  }

  public void deleteComment(String id) {
    CommentEntity comment = adminMongoTemplate.findById(id, CommentEntity.class);
    if (comment != null) {
      adminMongoTemplate.remove(comment);
    }
  }

  public Page<SubscriptionEntity> listSubscriptions(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), SubscriptionEntity.class);
    var items = adminMongoTemplate.find(query, SubscriptionEntity.class);
    return new PageImpl<>(items, pageable, total);
  }

  public SubscriptionEntity getSubscription(String id) {
    return adminMongoTemplate.findById(id, SubscriptionEntity.class);
  }

  public SubscriptionEntity createSubscription(AdminSubscriptionRequest request) {
    SubscriptionEntity entity = new SubscriptionEntity();
    if (request.getSubscriberId() != null) {
      UserEntity subscriber = adminMongoTemplate.findById(request.getSubscriberId(), UserEntity.class);
      entity.setSubscriber(subscriber);
    }
    if (request.getChannelId() != null) {
      UserEntity channel = adminMongoTemplate.findById(request.getChannelId(), UserEntity.class);
      entity.setChannel(channel);
    }
    return adminMongoTemplate.save(entity);
  }

  public SubscriptionEntity updateSubscription(String id, AdminSubscriptionRequest request) {
    SubscriptionEntity entity = adminMongoTemplate.findById(id, SubscriptionEntity.class);
    if (entity == null) {
      return null;
    }
    if (request.getSubscriberId() != null) {
      UserEntity subscriber = adminMongoTemplate.findById(request.getSubscriberId(), UserEntity.class);
      entity.setSubscriber(subscriber);
    }
    if (request.getChannelId() != null) {
      UserEntity channel = adminMongoTemplate.findById(request.getChannelId(), UserEntity.class);
      entity.setChannel(channel);
    }
    return adminMongoTemplate.save(entity);
  }

  public void deleteSubscription(String id) {
    SubscriptionEntity entity = adminMongoTemplate.findById(id, SubscriptionEntity.class);
    if (entity != null) {
      adminMongoTemplate.remove(entity);
    }
  }

  public Page<VideoReaction> listReactions(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), VideoReaction.class);
    var items = adminMongoTemplate.find(query, VideoReaction.class);
    return new PageImpl<>(items, pageable, total);
  }

  public VideoReaction getReaction(String id) {
    return adminMongoTemplate.findById(id, VideoReaction.class);
  }

  public VideoReaction createReaction(AdminReactionRequest request) {
    VideoReaction reaction = new VideoReaction();
    if (request.getVideoId() != null) {
      VideoEntity video = adminMongoTemplate.findById(request.getVideoId(), VideoEntity.class);
      reaction.setVideo(video);
    }
    if (request.getUserId() != null) {
      UserEntity user = adminMongoTemplate.findById(request.getUserId(), UserEntity.class);
      reaction.setUser(user);
    }
    reaction.setType(request.getType());
    return adminMongoTemplate.save(reaction);
  }

  public VideoReaction updateReaction(String id, AdminReactionRequest request) {
    VideoReaction reaction = adminMongoTemplate.findById(id, VideoReaction.class);
    if (reaction == null) {
      return null;
    }
    if (request.getType() != null) reaction.setType(request.getType());
    if (request.getVideoId() != null) {
      VideoEntity video = adminMongoTemplate.findById(request.getVideoId(), VideoEntity.class);
      reaction.setVideo(video);
    }
    if (request.getUserId() != null) {
      UserEntity user = adminMongoTemplate.findById(request.getUserId(), UserEntity.class);
      reaction.setUser(user);
    }
    return adminMongoTemplate.save(reaction);
  }

  public void deleteReaction(String id) {
    VideoReaction reaction = adminMongoTemplate.findById(id, VideoReaction.class);
    if (reaction != null) {
      adminMongoTemplate.remove(reaction);
    }
  }

  public Page<VideoView> listViews(int page, int size) {
    Pageable pageable = PageRequest.of(page, size);
    Query query = new Query().with(pageable);
    long total = adminMongoTemplate.count(new Query(), VideoView.class);
    var items = adminMongoTemplate.find(query, VideoView.class);
    return new PageImpl<>(items, pageable, total);
  }

  public VideoView getView(String id) {
    return adminMongoTemplate.findById(id, VideoView.class);
  }

  public VideoView createView(String userId, String videoId) {
    VideoView view = new VideoView(userId, videoId);
    return adminMongoTemplate.save(view);
  }

  public void deleteView(String id) {
    VideoView view = adminMongoTemplate.findById(id, VideoView.class);
    if (view != null) {
      adminMongoTemplate.remove(view);
    }
  }
}

