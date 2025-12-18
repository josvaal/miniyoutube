package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminViewRequest;
import com.josval.miniyoutube.video.VideoView;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/views")
@RequiredArgsConstructor
public class AdminViewController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<VideoView> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listViews(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<VideoView> get(@PathVariable String id) {
    VideoView view = adminCrudService.getView(id);
    return view != null ? ResponseEntity.ok(view) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<VideoView> create(@RequestBody AdminViewRequest request) {
    VideoView created = adminCrudService.createView(request.getUserId(), request.getVideoId());
    return ResponseEntity.ok(created);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteView(id);
    return ResponseEntity.noContent().build();
  }
}

