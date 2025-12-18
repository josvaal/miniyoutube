package com.josval.miniyoutube.admin.dto;

import java.util.Date;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCommentRequest {
  private String videoId;
  private String userId;
  private String parentId;
  private String body;
  private Date createdAt;
}

