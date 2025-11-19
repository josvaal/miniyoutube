package com.josval.miniyoutube.user;

import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "users")
public class UserEntity {
  @MongoId
  private String id;

  @Indexed(unique = true)
  private String username;

  @Indexed(unique = true)
  private String email;

  private String password;
  private String channelName;
  private String avatarURL;

  @CreatedDate
  private Date createdAt;
}
