package com.josval.miniyoutube.admin.dto;

import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import java.util.Collection;
import java.util.Date;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminVideoRequest {
  private String creatorId;
  private String title;
  private String description;
  private VideoPrivacyStatus privacyStatus;
  private String videoUrl;
  private String thumbnailUrl;
  private Integer durationSec;
  private Collection<String> tags;
  private Integer viewsCount;
  private Integer likesCount;
  private Integer dislikesCount;
  private VideoProcessingStatus processingStatus;
  private String hlsManifestUrl;
  private String originalVideoUrl;
  private Collection<String> availableQualities;
  private Date createdAt;
}

