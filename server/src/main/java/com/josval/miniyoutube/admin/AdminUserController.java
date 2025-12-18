package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminUserRequest;
import com.josval.miniyoutube.user.UserEntity;
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
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<UserEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listUsers(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<UserEntity> get(@PathVariable String id) {
    UserEntity user = adminCrudService.getUser(id);
    return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<UserEntity> create(@RequestBody AdminUserRequest request) {
    UserEntity created = adminCrudService.createUser(request);
    return ResponseEntity.ok(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<UserEntity> update(@PathVariable String id, @RequestBody AdminUserRequest request) {
    UserEntity updated = adminCrudService.updateUser(id, request);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteUser(id);
    return ResponseEntity.noContent().build();
  }
}

