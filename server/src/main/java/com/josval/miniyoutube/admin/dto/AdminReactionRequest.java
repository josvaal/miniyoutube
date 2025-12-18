package com.josval.miniyoutube.admin.dto;

import com.josval.miniyoutube.video.enums.ReactionType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminReactionRequest {
  private String videoId;
  private String userId;
  private ReactionType type;
}

