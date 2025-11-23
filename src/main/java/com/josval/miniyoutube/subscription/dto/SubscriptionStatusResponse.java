package com.josval.miniyoutube.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SubscriptionStatusResponse {

  private boolean subscribed;
  private Long subscriberCount;
}
