package com.josval.miniyoutube.admin.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminSubscriptionRequest {
  private String subscriberId;
  private String channelId;
}

