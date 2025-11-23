package com.josval.miniyoutube.subscription;

import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import com.josval.miniyoutube.user.UserEntity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "subscripciones")
public class SubscriptionEntity {
  @MongoId
  private String id;

  @DBRef
  private UserEntity subscriber;

  @DBRef
  private UserEntity channel;
}
