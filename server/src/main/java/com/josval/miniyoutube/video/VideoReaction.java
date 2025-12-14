package com.josval.miniyoutube.video;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.enums.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "video_reactions")
@CompoundIndex(name = "user_video_idx", def = "{'user': 1, 'video': 1}", unique = true)
public class VideoReaction {
  @MongoId
  private String id;

  @DBRef
  private VideoEntity video;

  @DBRef
  private UserEntity user;

  private ReactionType type; // LIKE o DISLIKE

  private Date reactedAt;
}
