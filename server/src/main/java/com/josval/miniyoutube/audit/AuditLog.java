package com.josval.miniyoutube.audit;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.Date;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {
  @MongoId
  private String id;

  @Indexed
  private String userId;

  @Indexed
  private String action;

  private Map<String, Object> metadata;

  @CreatedDate
  @Indexed(name = "audit_created_ttl", expireAfterSeconds = 7776000) // 90 días
  private Date createdAt;
}
