package com.josval.miniyoutube.admin;

import com.josval.miniyoutube.admin.dto.AdminSubscriptionRequest;
import com.josval.miniyoutube.subscription.SubscriptionEntity;
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
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
public class AdminSubscriptionController {

  private final AdminCrudService adminCrudService;

  @GetMapping
  public Page<SubscriptionEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return adminCrudService.listSubscriptions(page, size);
  }

  @GetMapping("/{id}")
  public ResponseEntity<SubscriptionEntity> get(@PathVariable String id) {
    SubscriptionEntity entity = adminCrudService.getSubscription(id);
    return entity != null ? ResponseEntity.ok(entity) : ResponseEntity.notFound().build();
  }

  @PostMapping
  public ResponseEntity<SubscriptionEntity> create(@RequestBody AdminSubscriptionRequest request) {
    SubscriptionEntity created = adminCrudService.createSubscription(request);
    return ResponseEntity.ok(created);
  }

  @PutMapping("/{id}")
  public ResponseEntity<SubscriptionEntity> update(@PathVariable String id, @RequestBody AdminSubscriptionRequest request) {
    SubscriptionEntity updated = adminCrudService.updateSubscription(id, request);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable String id) {
    adminCrudService.deleteSubscription(id);
    return ResponseEntity.noContent().build();
  }
}

