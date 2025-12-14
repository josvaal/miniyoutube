package com.josval.miniyoutube.video;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "video_views")
@CompoundIndex(name = "user_video_idx", def = "{'userId': 1, 'videoId': 1}", unique = true)
public class VideoView {
  @MongoId
  private String id;

  private String userId;
  private String videoId;

  @CreatedDate
  @Indexed(name = "viewedAt_ttl_idx", expireAfterSeconds = 15552000) // 180 días
  private Date viewedAt;

  public VideoView(String userId, String videoId) {
    this.userId = userId;
    this.videoId = videoId;
    this.viewedAt = new Date();
  }
}
