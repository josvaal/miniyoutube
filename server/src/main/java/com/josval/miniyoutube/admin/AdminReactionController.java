package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminReactionRequest;
import com.josval.miniyoutube.video.VideoReaction;
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
@RequestMapping("/api/admin/reactions")
@RequiredArgsConstructor
public class AdminReactionController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<VideoReaction> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listReactions(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<VideoReaction> get(@PathVariable String id) {
    VideoReaction reaction = adminCrudService.getReaction(id);
    return reaction != null ? ResponseEntity.ok(reaction) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<VideoReaction> create(@RequestBody AdminReactionRequest request) {
    VideoReaction created = adminCrudService.createReaction(request);
    return ResponseEntity.ok(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<VideoReaction> update(@PathVariable String id, @RequestBody AdminReactionRequest request) {
    VideoReaction updated = adminCrudService.updateReaction(id, request);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteReaction(id);
    return ResponseEntity.noContent().build();
  }
}

