package com.josval.miniyoutube.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

  private final AuditLogRepository auditLogRepository;

  public void log(String userId, String action, Map<String, Object> metadata) {
    try {
      AuditLog logEntry = new AuditLog();
      logEntry.setUserId(userId);
      logEntry.setAction(action);
      logEntry.setMetadata(metadata);
      auditLogRepository.save(logEntry);
    } catch (Exception e) {
      log.warn("No se pudo guardar audit log para acción {}: {}", action, e.getMessage());
    }
  }
}
