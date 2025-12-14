package com.josval.miniyoutube.comment;

import com.josval.miniyoutube.comment.dto.CommentResponse;
import com.josval.miniyoutube.comment.dto.CreateCommentRequest;
import com.josval.miniyoutube.comment.dto.UpdateCommentRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

  private final CommentService commentService;

  @PostMapping("/{videoId}")
  public ResponseEntity<CommentResponse> createComment(
      @Parameter(description = "ID del video") @PathVariable String videoId,
      @Valid @RequestBody CreateCommentRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String userEmail = authentication.getName();

    CommentResponse comment = commentService.createComment(videoId, userEmail, request);
    return ResponseEntity.ok(comment);
  }

  @GetMapping("/{commentId}/replies")
  public ResponseEntity<Page<CommentResponse>> listCommentReplies(
      @Parameter(description = "ID del comentario") @PathVariable String commentId,
      @Parameter(description = "Número de página (empezando en 0)") @RequestParam(defaultValue = "0") int page,
      @Parameter(description = "Tamaño de página") @RequestParam(defaultValue = "10") int size) {
    Page<CommentResponse> replies = commentService.listCommentReplies(commentId, page, size);
    return ResponseEntity.ok(replies);
  }

  @GetMapping("/{commentId}")
  public ResponseEntity<CommentResponse> getComment(
      @Parameter(description = "ID del comentario") @PathVariable String commentId) {
    try {
      CommentResponse comment = commentService.getComment(commentId);
      return ResponseEntity.ok(comment);
    } catch (RuntimeException e) {
      return ResponseEntity.notFound().build();
    }
  }

  @PutMapping("/{commentId}")
  public ResponseEntity<CommentResponse> updateComment(
      @Parameter(description = "ID del comentario") @PathVariable String commentId,
      @Valid @RequestBody UpdateCommentRequest request) {
    try {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      String userEmail = authentication.getName();

      CommentResponse comment = commentService.updateComment(commentId, userEmail, request);
      return ResponseEntity.ok(comment);
    } catch (RuntimeException e) {
      return ResponseEntity.status(403).build();
    }
  }

  @DeleteMapping("/{commentId}")
  public ResponseEntity<Void> deleteComment(
      @Parameter(description = "ID del comentario") @PathVariable String commentId) {
    try {
      Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
      String userEmail = authentication.getName();

      commentService.deleteComment(commentId, userEmail);
      return ResponseEntity.noContent().build();
    } catch (RuntimeException e) {
      return ResponseEntity.status(403).build();
    }
  }
}
