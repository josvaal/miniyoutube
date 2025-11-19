package com.josval.miniyoutube.document;

import java.util.Date;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import com.josval.miniyoutube.user.UserEntity;
import com.josval.miniyoutube.video.VideoEntity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "documentos")
public class DocumentEntity {
  @MongoId
  private String id;

  @DBRef
  private VideoEntity video;

  @DBRef
  private UserEntity user;

  private String body;

  @DBRef(lazy = true)
  private DocumentEntity parent;

  @CreatedDate
  private Date createdAt;
}
