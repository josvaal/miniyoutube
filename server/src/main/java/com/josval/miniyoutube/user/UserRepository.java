package com.josval.miniyoutube.user;

import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends MongoRepository<UserEntity, String> {
  Optional<UserEntity> findByEmail(String email);
  Optional<UserEntity> findByUsername(String username);
  boolean existsByEmail(String email);
  boolean existsByUsername(String username);
}
