package com.josval.miniyoutube.admin;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  @Qualifier("adminMongoTemplate")
  private final MongoTemplate adminMongoTemplate;

  @GetMapping("/ping")
  public ResponseEntity<Map<String, Object>> ping() {
    return ResponseEntity.ok(Map.of("status", "admin-ok"));
  }

  @GetMapping("/metrics/summary")
  public ResponseEntity<Map<String, Object>> summary() {
    long users = adminMongoTemplate.count(new Query(), "users");
    long videos = adminMongoTemplate.count(new Query(), "videos");

    return ResponseEntity.ok(Map.of(
        "users", users,
        "videos", videos
    ));
  }
}

