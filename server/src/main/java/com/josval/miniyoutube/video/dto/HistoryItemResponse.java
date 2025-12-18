package com.josval.miniyoutube.video.dto;

import com.josval.miniyoutube.video.dto.VideoResponse;
import java.util.Date;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HistoryItemResponse {
  private VideoResponse video;
  private Date viewedAt;
}
