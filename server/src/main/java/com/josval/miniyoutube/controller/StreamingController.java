package com.josval.miniyoutube.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

import java.io.IOException;

@RestController
@RequestMapping("/api/stream")
@RequiredArgsConstructor
@Slf4j
public class StreamingController {

  private final S3Client s3Client;
  private final String s3BucketName;

  /**
   * Endpoint para servir archivos HLS (m3u8 y ts) desde S3
   * Ruta de ejemplo: /api/stream/videos/{videoId}/hls/master.m3u8
   */
  @GetMapping("/**")
  public ResponseEntity<byte[]> streamFile(HttpServletRequest request) {
    // Extraer el path después de /api/stream/
    String path = request.getRequestURI().substring("/api/stream/".length());
    try {
      log.info("Sirviendo archivo: {}", path);

      // Obtener el archivo de S3
      GetObjectRequest getObjectRequest = GetObjectRequest.builder()
          .bucket(s3BucketName)
          .key(path)
          .build();

      ResponseInputStream<GetObjectResponse> s3Object = s3Client.getObject(getObjectRequest);
      byte[] content = s3Object.readAllBytes();

      // Si es un archivo .m3u8, reescribir las URLs relativas
      if (path.endsWith(".m3u8")) {
        content = rewriteM3u8Urls(content, path);
      }

      // Determinar Content-Type basado en la extensión
      String contentType = determineContentType(path);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.parseMediaType(contentType));
      headers.setCacheControl("public, max-age=31536000"); // Cache por 1 año
      // CORS headers se manejan globalmente en SecurityConfig - no los agregamos manualmente

      return new ResponseEntity<>(content, headers, HttpStatus.OK);

    } catch (IOException e) {
      log.error("Error al leer archivo de S3: {}", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    } catch (Exception e) {
      log.error("Error al servir archivo: {}", e.getMessage());
      return ResponseEntity.notFound().build();
    }
  }

  /**
   * Reescribe las URLs relativas en archivos .m3u8 para que apunten al endpoint del backend
   */
  private byte[] rewriteM3u8Urls(byte[] content, String currentPath) {
    try {
      String m3u8Content = new String(content, "UTF-8");
      String[] lines = m3u8Content.split("\n");
      StringBuilder rewritten = new StringBuilder();

      // Obtener el directorio base del archivo actual
      String baseDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

      for (String line : lines) {
        // Si la línea no empieza con # y no está vacía, es una referencia a un archivo
        if (!line.trim().isEmpty() && !line.trim().startsWith("#")) {
          // Si no es una URL absoluta, convertirla a URL del backend
          if (!line.startsWith("http://") && !line.startsWith("https://")) {
            String filePath = baseDir + "/" + line.trim();
            line = "http://localhost:8080/api/stream/" + filePath;
          }
        }
        rewritten.append(line).append("\n");
      }

      return rewritten.toString().getBytes("UTF-8");
    } catch (Exception e) {
      log.error("Error al reescribir URLs en m3u8: {}", e.getMessage());
      return content; // Retornar contenido original si hay error
    }
  }

  private String determineContentType(String path) {
    if (path.endsWith(".m3u8")) {
      return "application/vnd.apple.mpegurl";
    } else if (path.endsWith(".ts")) {
      return "video/MP2T";
    } else if (path.endsWith(".mp4")) {
      return "video/mp4";
    } else if (path.endsWith(".jpg") || path.endsWith(".jpeg")) {
      return "image/jpeg";
    } else if (path.endsWith(".png")) {
      return "image/png";
    }
    return "application/octet-stream";
  }
}
