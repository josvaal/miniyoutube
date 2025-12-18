package com.josval.miniyoutube.admin.dto;

import java.util.Date;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserRequest {
  private String username;
  private String email;
  private String password;
  private String channelName;
  private String avatarURL;
  private Date createdAt;
}

