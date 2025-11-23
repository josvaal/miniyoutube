package com.josval.miniyoutube.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionResponse {

  private String channelId;
  private String username;
  private String channelName;
  private String avatarUrl;
  private Long subscriberCount;
}
