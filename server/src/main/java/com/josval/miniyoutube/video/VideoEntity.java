package com.josval.miniyoutube.video;

import java.util.Date;
import java.util.Collection;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.VideoPrivacyStatus;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "videos")
@CompoundIndexes({
    @CompoundIndex(name = "privacy_processing_created_idx",
        def = "{'privacyStatus': 1, 'processingStatus': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "creator_created_idx",
        def = "{'creator': 1, 'createdAt': -1}")
})
public class VideoEntity {
  @MongoId
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

  // HLS streaming fields
  private VideoProcessingStatus processingStatus;
  private String hlsManifestUrl;  // URL del archivo .m3u8 master
  private String originalVideoUrl;  // Video original sin procesar
  private Collection<String> availableQualities;  // Calidades disponibles: ["360p", "480p", ...]

  @CreatedDate
  private Date createdAt;
}
