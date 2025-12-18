package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminVideoRequest;
import com.josval.miniyoutube.video.VideoEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/videos")
@RequiredArgsConstructor
public class AdminVideoController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<VideoEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listVideos(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<VideoEntity> get(@PathVariable String id) {
    VideoEntity video = adminCrudService.getVideo(id);
    return video != null ? ResponseEntity.ok(video) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<VideoEntity> create(@RequestBody AdminVideoRequest request) {
    VideoEntity created = adminCrudService.createVideo(request);
    return ResponseEntity.ok(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<VideoEntity> update(@PathVariable String id, @RequestBody AdminVideoRequest request) {
    VideoEntity updated = adminCrudService.updateVideo(id, request);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteVideo(id);
    return ResponseEntity.noContent().build();
  }
}

