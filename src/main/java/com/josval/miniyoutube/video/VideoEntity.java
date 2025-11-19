package com.josval.miniyoutube.video;

import java.util.Date;
import java.util.Collection;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "video")
public class VideoEntity {
  @Id
  private String id;
  @DBRef
  private UserEntity creator;
  private String title;
  private String description;
  private VideoPrivacyStatus privacyStatus;
  private String videoUrl;
  private String thumbnailUrl;
  private Integer duration_sec;
  private Collection<String> tags;
  private Integer views_count;
  private Integer likes_count;
  private Integer dislikes_count;
  @CreatedDate
  private Date createdAt;
}
