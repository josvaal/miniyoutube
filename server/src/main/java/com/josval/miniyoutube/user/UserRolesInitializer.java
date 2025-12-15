package com.josval.miniyoutube.user;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRolesInitializer {

  private final MongoTemplate mongoTemplate;

  /**
   * Asegura que todos los usuarios tengan un rol por defecto en BD.
   */
  @EventListener(ApplicationReadyEvent.class)
  public void ensureRoles() {
    Query missingRoles = new Query(Criteria.where("roles").exists(false));
    Update setAuthRole = new Update().set("roles", List.of("AUTENTICADO"));
    var result = mongoTemplate.updateMulti(missingRoles, setAuthRole, UserEntity.class);
    if (result.getModifiedCount() > 0) {
      log.info("Roles 'AUTENTICADO' aplicados a {} usuarios sin rol", result.getModifiedCount());
    }
  }
}
