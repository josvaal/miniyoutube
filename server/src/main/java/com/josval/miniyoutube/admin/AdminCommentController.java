package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminCommentRequest;
import com.josval.miniyoutube.comment.CommentEntity;
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
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<CommentEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listComments(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<CommentEntity> get(@PathVariable String id) {
    CommentEntity comment = adminCrudService.getComment(id);
    return comment != null ? ResponseEntity.ok(comment) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<CommentEntity> create(@RequestBody AdminCommentRequest request) {
    CommentEntity created = adminCrudService.createComment(request);
    return ResponseEntity.ok(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<CommentEntity> update(@PathVariable String id, @RequestBody AdminCommentRequest request) {
    CommentEntity updated = adminCrudService.updateComment(id, request);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteComment(id);
    return ResponseEntity.noContent().build();
  }
}

