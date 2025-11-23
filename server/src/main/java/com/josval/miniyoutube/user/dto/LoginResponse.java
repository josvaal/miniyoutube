package com.josval.miniyoutube.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
  private String token;
  private String userId;
  private String username;
  private String email;
  private String channelName;
  private String avatarURL;
}
