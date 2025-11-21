package com.josval.miniyoutube.service;

import java.io.IOException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
public class S3Service {

  private final S3Client s3Client;
  private final String s3BucketName;

  public String uploadFile(MultipartFile file, String folder) {
    try {
      // Generar nombre único para el archivo
      String fileName = generateFileName(file.getOriginalFilename());
      String key = folder + "/" + fileName;

      // Subir archivo a S3
      PutObjectRequest putObjectRequest = PutObjectRequest.builder()
          .bucket(s3BucketName)
          .key(key)
          .contentType(file.getContentType())
          .build();

      s3Client.putObject(
          putObjectRequest,
          RequestBody.fromInputStream(file.getInputStream(), file.getSize())
      );

      // Retornar URL del archivo
      return getFileUrl(key);
    } catch (IOException e) {
      throw new RuntimeException("Error al subir archivo a S3: " + e.getMessage(), e);
    }
  }

  private String generateFileName(String originalFilename) {
    String extension = "";
    if (originalFilename != null && originalFilename.contains(".")) {
      extension = originalFilename.substring(originalFilename.lastIndexOf("."));
    }
    return UUID.randomUUID().toString() + extension;
  }

  private String getFileUrl(String key) {
    // Para LocalStack, la URL será: http://localhost:4566/bucket-name/key
    return String.format("http://localhost:4566/%s/%s", s3BucketName, key);
  }

  public void deleteFile(String fileUrl) {
    try {
      // Extraer el key de la URL
      String key = extractKeyFromUrl(fileUrl);
      if (key != null) {
        s3Client.deleteObject(builder -> builder
            .bucket(s3BucketName)
            .key(key)
            .build()
        );
      }
    } catch (Exception e) {
      throw new RuntimeException("Error al eliminar archivo de S3: " + e.getMessage(), e);
    }
  }

  private String extractKeyFromUrl(String fileUrl) {
    if (fileUrl == null || fileUrl.isEmpty()) {
      return null;
    }
    // Extraer el key de una URL como: http://localhost:4566/bucket-name/folder/file.jpg
    String[] parts = fileUrl.split(s3BucketName + "/");
    return parts.length > 1 ? parts[1] : null;
  }
}
