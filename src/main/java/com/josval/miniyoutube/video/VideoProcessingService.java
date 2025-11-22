package com.josval.miniyoutube.video;

import com.josval.miniyoutube.service.S3Service;
import com.josval.miniyoutube.video.enums.VideoProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoProcessingService {

  private final VideoRepository videoRepository;
  private final S3Service s3Service;

  @Value("${video.max.size:524288000}") // 500MB por defecto
  private long maxVideoSize;

  private static final List<String> ALLOWED_FORMATS = Arrays.asList(
      "video/mp4", "video/x-msvideo", "video/quicktime", "video/webm",
      "application/octet-stream" // Algunos navegadores envían esto para videos
  );

  private static final String[] HLS_QUALITIES = {
      "360p", "480p", "720p", "1080p"
  };

  /**
   * Procesar todas las calidades de forma incremental (asíncrono)
   * Cada calidad se procesa, sube a S3 y actualiza la BD inmediatamente
   */
  @Async
  public void processAllQualitiesIncremental(String videoId, String tempFilePath) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    File uploadedFile = new File(tempFilePath);

    try {
      log.info("Iniciando procesamiento incremental de video: {}", videoId);

      if (!uploadedFile.exists()) {
        throw new RuntimeException("Archivo temporal no encontrado: " + tempFilePath);
      }

      // Validar tamaño
      validateVideoSize(uploadedFile);

      // Crear directorio temporal
      Path tempDir = Files.createTempDirectory("video-incremental-" + videoId);
      File hlsOutputDir = tempDir.resolve("hls").toFile();
      hlsOutputDir.mkdirs();

      // 1. Obtener duración, resolución original y generar thumbnail primero
      log.info("Extrayendo metadatos del video: {}", videoId);
      int duration = getVideoDuration(uploadedFile);
      int[] originalResolution = getVideoResolution(uploadedFile);
      String thumbnailUrl = generateAndUploadThumbnail(uploadedFile, videoId, tempDir);

      video.setDuration_sec(duration);
      video.setThumbnailUrl(thumbnailUrl);
      videoRepository.save(video);

      log.info("Video original: {}x{} ({}p)", originalResolution[0], originalResolution[1], originalResolution[1]);

      // 2. Determinar qué calidades generar (solo hasta la resolución original)
      String[] allQualities = {"360p", "480p", "720p", "1080p"};
      List<String> qualitiesToProcess = filterQualitiesToProcess(allQualities, originalResolution[1]);

      log.info("Calidades a procesar: {} (de {} posibles)", qualitiesToProcess, allQualities.length);

      List<String> availableQualities = new ArrayList<>();

      for (String quality : qualitiesToProcess) {
        log.info("Procesando calidad {} para video {}", quality, videoId);

        if (generateAndUploadQuality(uploadedFile, videoId, quality, hlsOutputDir)) {
          availableQualities.add(quality);

          // Actualizar BD inmediatamente con la nueva calidad disponible
          video.setAvailableQualities(new ArrayList<>(availableQualities));

          // Crear/actualizar master.m3u8 con las calidades disponibles hasta ahora
          String manifestUrl = createAndUploadMasterPlaylist(availableQualities, videoId, hlsOutputDir, originalResolution);
          video.setVideoUrl(manifestUrl);
          video.setHlsManifestUrl(manifestUrl);

          // Si es la primera calidad, marcar como COMPLETED
          if (availableQualities.size() == 1) {
            video.setProcessingStatus(VideoProcessingStatus.COMPLETED);
          }

          videoRepository.save(video);
          log.info("Calidad {} lista y disponible. Total: {}/{}", quality, availableQualities.size(), qualitiesToProcess.size());
        }
      }

      // Limpiar archivos temporales
      deleteDirectory(tempDir.toFile());
      Files.deleteIfExists(uploadedFile.toPath());

      log.info("Procesamiento completo de video {}: {} calidades disponibles", videoId, availableQualities.size());

    } catch (Exception e) {
      log.error("Error en procesamiento incremental de video {}: {}", videoId, e.getMessage(), e);
      video.setProcessingStatus(VideoProcessingStatus.FAILED);
      videoRepository.save(video);

      try {
        Files.deleteIfExists(uploadedFile.toPath());
      } catch (IOException ex) {
        log.warn("No se pudo eliminar archivo temporal: {}", uploadedFile.getPath());
      }
    }
  }

  /**
   * Generar 360p HLS + thumbnail de forma síncrona (para visualización inmediata)
   * DEPRECATED - Ya no se usa, ahora usamos processAllQualitiesIncremental
   */
  @Deprecated
  public java.util.Map<String, String> generateLowQualityHLSSync(File videoFile, String videoId) throws IOException, InterruptedException {
    log.info("Generando 360p HLS y thumbnail para visualización inmediata: {}", videoId);

    // Validar tamaño
    validateVideoSize(videoFile);

    // Crear directorio temporal
    Path tempDir = Files.createTempDirectory("video-quick-" + videoId);
    File hlsOutputDir = tempDir.resolve("hls").toFile();
    hlsOutputDir.mkdirs();

    // 1. Obtener duración
    int duration = getVideoDuration(videoFile);

    // 2. Generar thumbnail
    String thumbnailUrl = generateAndUploadThumbnail(videoFile, videoId, tempDir);

    // 3. Generar solo 360p HLS
    String quality = "360p";
    String outputName = "playlist_360p";
    File outputPlaylist = new File(hlsOutputDir, outputName + ".m3u8");

    int[] resolution = getResolution(quality);
    int videoBitrate = getVideoBitrate(quality);

    log.info("Generando calidad {} para visualización inmediata", quality);

    ProcessBuilder processBuilder = new ProcessBuilder(
        "ffmpeg",
        "-i", videoFile.getAbsolutePath(),
        "-vf", "scale=" + resolution[0] + ":" + resolution[1],
        "-c:v", "libx264",
        "-b:v", videoBitrate + "k",
        "-c:a", "aac",
        "-b:a", "128k",
        "-hls_time", "10",
        "-hls_playlist_type", "vod",
        "-hls_segment_filename", new File(hlsOutputDir, outputName + "_%03d.ts").getAbsolutePath(),
        outputPlaylist.getAbsolutePath()
    );

    processBuilder.redirectErrorStream(true);
    Process process = processBuilder.start();

    // Capturar salida de ffmpeg
    BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
    String line;
    StringBuilder output = new StringBuilder();
    while ((line = reader.readLine()) != null) {
      output.append(line).append("\n");
    }

    int exitCode = process.waitFor();

    if (exitCode != 0) {
      log.error("Error generando 360p. Exit code: {}. Output:\n{}", exitCode, output.toString());
      throw new RuntimeException("Error generando calidad 360p para visualización inmediata");
    }

    log.info("Calidad 360p generada exitosamente");

    // 4. Subir 360p a S3
    String playlist360pUrl = uploadHLSFiles360p(hlsOutputDir, videoId);

    // 5. Limpiar directorio temporal
    deleteDirectory(tempDir.toFile());

    log.info("360p HLS listo para streaming: {}", playlist360pUrl);

    // Retornar resultados
    java.util.Map<String, String> result = new java.util.HashMap<>();
    result.put("playlist360pUrl", playlist360pUrl);
    result.put("thumbnailUrl", thumbnailUrl);
    result.put("duration", String.valueOf(duration));

    return result;
  }

  /**
   * Procesar calidades restantes (480p, 720p, 1080p) + master.m3u8 en background
   */
  @Async
  public void processRemainingQualitiesHLS(String videoId, String tempFilePath) {
    VideoEntity video = videoRepository.findById(videoId)
        .orElseThrow(() -> new RuntimeException("Video no encontrado"));

    File uploadedFile = new File(tempFilePath);

    try {
      log.info("Iniciando procesamiento de calidades restantes (480p, 720p, 1080p) para video: {}", videoId);

      // Validar que el archivo existe
      if (!uploadedFile.exists()) {
        throw new RuntimeException("Archivo temporal no encontrado: " + tempFilePath);
      }

      // Crear directorio temporal para procesamiento
      Path tempDir = Files.createTempDirectory("video-processing-" + videoId);
      File originalFile = tempDir.resolve("original" + getFileExtension(uploadedFile.getName())).toFile();

      // Copiar archivo cargado a directorio de procesamiento
      Files.copy(uploadedFile.toPath(), originalFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

      // Procesar calidades restantes (480p, 720p, 1080p) + master.m3u8
      log.info("Generando calidades 480p, 720p, 1080p y master.m3u8");
      String masterManifestUrl = generateRemainingQualitiesAndMaster(originalFile, videoId, tempDir);

      // Actualizar con master.m3u8 (ahora tiene todas las calidades)
      video.setHlsManifestUrl(masterManifestUrl);
      video.setVideoUrl(masterManifestUrl); // Ahora usar master.m3u8 con todas las calidades
      videoRepository.save(video);

      // Limpiar archivos temporales
      deleteDirectory(tempDir.toFile());

      // Eliminar archivo temporal original
      try {
        Files.deleteIfExists(uploadedFile.toPath());
      } catch (IOException e) {
        log.warn("No se pudo eliminar archivo temporal: {}", uploadedFile.getPath());
      }

      log.info("Todas las calidades HLS completadas para video: {}", videoId);

    } catch (Exception e) {
      log.error("Error procesando calidades restantes para video {}: {}", videoId, e.getMessage(), e);
      // No cambiar el estado a FAILED - el video 360p sigue disponible
      log.warn("El video {} sigue disponible en 360p, pero calidades superiores fallaron", videoId);

      // Intentar limpiar archivo temporal en caso de error
      try {
        Files.deleteIfExists(uploadedFile.toPath());
      } catch (IOException ex) {
        log.warn("No se pudo eliminar archivo temporal: {}", uploadedFile.getPath());
      }
    }
  }

  /**
   * Generar una calidad específica y subirla a S3
   * Retorna true si se generó exitosamente, false si falló
   */
  private boolean generateAndUploadQuality(File videoFile, String videoId, String quality, File hlsOutputDir) {
    try {
      String outputName = "playlist_" + quality;
      File outputPlaylist = new File(hlsOutputDir, outputName + ".m3u8");

      int targetHeight = Integer.parseInt(quality.replace("p", ""));
      int videoBitrate = getVideoBitrate(quality);

      // Usar scale con -2 para mantener aspect ratio automáticamente
      // -2 hace que ffmpeg calcule el width automáticamente y sea divisible por 2
      String scaleFilter = "scale=-2:" + targetHeight;

      ProcessBuilder processBuilder = new ProcessBuilder(
          "ffmpeg",
          "-i", videoFile.getAbsolutePath(),
          "-vf", scaleFilter,  // Mantiene aspect ratio original
          "-c:v", "libx264",
          "-b:v", videoBitrate + "k",
          "-c:a", "aac",
          "-b:a", "128k",
          "-hls_time", "10",
          "-hls_playlist_type", "vod",
          "-hls_segment_filename", new File(hlsOutputDir, outputName + "_%03d.ts").getAbsolutePath(),
          outputPlaylist.getAbsolutePath()
      );

      processBuilder.redirectErrorStream(true);
      Process process = processBuilder.start();

      BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
      String line;
      while ((line = reader.readLine()) != null) {
        // Consumir output para evitar bloqueos
      }

      int exitCode = process.waitFor();

      if (exitCode != 0) {
        log.error("Error generando calidad {} para video {}. Exit code: {}", quality, videoId, exitCode);
        return false;
      }

      // Subir archivos a S3
      uploadQualityFiles(hlsOutputDir, videoId, outputName);

      log.info("Calidad {} generada y subida a S3 exitosamente", quality);
      return true;

    } catch (Exception e) {
      log.error("Excepción generando calidad {}: {}", quality, e.getMessage(), e);
      return false;
    }
  }

  /**
   * Subir archivos de una calidad específica a S3
   */
  private void uploadQualityFiles(File hlsDir, String videoId, String playlistName) throws IOException {
    String folderPrefix = "videos/" + videoId + "/hls";

    for (File file : hlsDir.listFiles()) {
      if (file.isFile() && file.getName().startsWith(playlistName)) {
        String contentType = file.getName().endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T";
        s3Service.uploadFile(file, folderPrefix, contentType);
      }
    }
  }

  /**
   * Crear y subir master.m3u8 con las calidades disponibles
   * Calcula resoluciones manteniendo el aspect ratio original
   */
  private String createAndUploadMasterPlaylist(List<String> availableQualities, String videoId, File hlsOutputDir, int[] originalResolution) throws IOException {
    File masterFile = new File(hlsOutputDir, "master.m3u8");

    StringBuilder content = new StringBuilder("#EXTM3U\n#EXT-X-VERSION:3\n");

    // Calcular aspect ratio original
    double aspectRatio = (double) originalResolution[0] / originalResolution[1];

    for (String quality : availableQualities) {
      String playlistName = "playlist_" + quality;
      int targetHeight = Integer.parseInt(quality.replace("p", ""));

      // Calcular width manteniendo aspect ratio original
      int targetWidth = (int) Math.round(targetHeight * aspectRatio);

      // Asegurar que sea par (requerimiento de codecs)
      if (targetWidth % 2 != 0) {
        targetWidth++;
      }

      int bandwidth = getVideoBitrate(quality) * 1000 + 128000;

      content.append("#EXT-X-STREAM-INF:BANDWIDTH=")
          .append(bandwidth)
          .append(",RESOLUTION=")
          .append(targetWidth)
          .append("x")
          .append(targetHeight)
          .append("\n")
          .append(playlistName)
          .append(".m3u8\n");
    }

    Files.write(masterFile.toPath(), content.toString().getBytes());

    // Subir master.m3u8 a S3
    String folderPrefix = "videos/" + videoId + "/hls";
    String url = s3Service.uploadFile(masterFile, folderPrefix, "application/vnd.apple.mpegurl");

    return url;
  }

  private void validateVideoSize(File file) {
    if (file.length() > maxVideoSize) {
      throw new RuntimeException("El video excede el tamaño máximo permitido de " + (maxVideoSize / 1024 / 1024) + "MB");
    }
  }

  private String detectContentType(String filename) {
    String extension = getFileExtension(filename).toLowerCase();
    switch (extension) {
      case ".mp4":
        return "video/mp4";
      case ".avi":
        return "video/x-msvideo";
      case ".mov":
        return "video/quicktime";
      case ".webm":
        return "video/webm";
      default:
        return "application/octet-stream";
    }
  }

  private int getVideoDuration(File videoFile) throws IOException, InterruptedException {
    // Comando ffprobe para obtener duración
    ProcessBuilder processBuilder = new ProcessBuilder(
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        videoFile.getAbsolutePath()
    );

    Process process = processBuilder.start();
    BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
    String durationStr = reader.readLine();
    process.waitFor();

    return durationStr != null ? (int) Double.parseDouble(durationStr) : 0;
  }

  private int[] getVideoResolution(File videoFile) throws IOException, InterruptedException {
    // Comando ffprobe para obtener resolución (ancho x alto)
    ProcessBuilder processBuilder = new ProcessBuilder(
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
        videoFile.getAbsolutePath()
    );

    Process process = processBuilder.start();
    BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
    String resolutionStr = reader.readLine();
    process.waitFor();

    if (resolutionStr != null && resolutionStr.contains(",")) {
      String[] parts = resolutionStr.split(",");
      int width = Integer.parseInt(parts[0].trim());
      int height = Integer.parseInt(parts[1].trim());
      return new int[]{width, height};
    }

    // Default si no se puede detectar
    return new int[]{1920, 1080};
  }

  private List<String> filterQualitiesToProcess(String[] allQualities, int originalHeight) {
    List<String> filtered = new ArrayList<>();

    for (String quality : allQualities) {
      int qualityHeight = Integer.parseInt(quality.replace("p", ""));

      // Solo incluir calidades menores o iguales a la original
      if (qualityHeight <= originalHeight) {
        filtered.add(quality);
      } else {
        log.info("Omitiendo calidad {} (mayor que original {}p)", quality, originalHeight);
      }
    }

    // Siempre incluir al menos 360p aunque el original sea menor
    if (filtered.isEmpty()) {
      filtered.add("360p");
    }

    return filtered;
  }

  private String generateAndUploadThumbnail(File videoFile, String videoId, Path tempDir) throws IOException, InterruptedException {
    // Generar thumbnail en el segundo 1 del video
    File thumbnailFile = tempDir.resolve("thumbnail.jpg").toFile();

    ProcessBuilder processBuilder = new ProcessBuilder(
        "ffmpeg",
        "-i", videoFile.getAbsolutePath(),
        "-ss", "00:00:01.000",
        "-vframes", "1",
        "-vf", "scale=1280:720",
        thumbnailFile.getAbsolutePath()
    );

    Process process = processBuilder.start();
    int exitCode = process.waitFor();

    if (exitCode != 0) {
      throw new RuntimeException("Error generando thumbnail");
    }

    // Subir thumbnail a S3
    return s3Service.uploadFile(thumbnailFile, "thumbnails", "image/jpeg");
  }

  private String generateRemainingQualitiesAndMaster(File videoFile, String videoId, Path tempDir) throws IOException, InterruptedException {
    File hlsOutputDir = tempDir.resolve("hls").toFile();
    hlsOutputDir.mkdirs();

    // Generar calidades restantes (480p, 720p, 1080p)
    // 360p ya existe, así que la incluimos en el master
    List<String> variantPlaylists = new ArrayList<>();
    variantPlaylists.add("playlist_360p"); // Ya existe

    String[] remainingQualities = {"480p", "720p", "1080p"};

    for (String quality : remainingQualities) {
      String outputName = "playlist_" + quality;
      File outputPlaylist = new File(hlsOutputDir, outputName + ".m3u8");

      int[] resolution = getResolution(quality);
      int videoBitrate = getVideoBitrate(quality);
      int audioBitrate = 128;

      log.info("Generando calidad {} para video {}", quality, videoId);

      ProcessBuilder processBuilder = new ProcessBuilder(
          "ffmpeg",
          "-i", videoFile.getAbsolutePath(),
          "-vf", "scale=" + resolution[0] + ":" + resolution[1],
          "-c:v", "libx264",
          "-b:v", videoBitrate + "k",
          "-c:a", "aac",
          "-b:a", audioBitrate + "k",
          "-hls_time", "10",
          "-hls_playlist_type", "vod",
          "-hls_segment_filename", new File(hlsOutputDir, outputName + "_%03d.ts").getAbsolutePath(),
          outputPlaylist.getAbsolutePath()
      );

      processBuilder.redirectErrorStream(true);
      Process process = processBuilder.start();

      // Capturar salida de ffmpeg
      BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
      String line;
      StringBuilder output = new StringBuilder();
      while ((line = reader.readLine()) != null) {
        output.append(line).append("\n");
      }

      int exitCode = process.waitFor();

      if (exitCode == 0) {
        variantPlaylists.add(outputName);
        log.info("Calidad {} generada exitosamente", quality);
      } else {
        log.error("Error generando calidad {} para video {}. Exit code: {}. Output:\n{}",
                  quality, videoId, exitCode, output.toString());
      }
    }

    // Verificar que al menos tenemos 360p
    if (variantPlaylists.isEmpty()) {
      throw new RuntimeException("No se pudo generar ninguna calidad de video HLS");
    }

    log.info("Se generaron {} calidades de video (incluyendo 360p)", variantPlaylists.size());

    // Crear master playlist con TODAS las calidades
    File masterPlaylist = new File(hlsOutputDir, "master.m3u8");
    createMasterPlaylist(masterPlaylist, variantPlaylists);

    // Subir todos los archivos HLS a S3 (calidades nuevas + master.m3u8)
    return uploadHLSFiles(hlsOutputDir, videoId);
  }

  private String generateHLSManifest(File videoFile, String videoId, Path tempDir) throws IOException, InterruptedException {
    File hlsOutputDir = tempDir.resolve("hls").toFile();
    hlsOutputDir.mkdirs();

    // Generar variantes de calidad con ffmpeg
    List<String> variantPlaylists = new ArrayList<>();

    for (String quality : HLS_QUALITIES) {
      String outputName = "playlist_" + quality;
      File outputPlaylist = new File(hlsOutputDir, outputName + ".m3u8");

      int[] resolution = getResolution(quality);
      int videoBitrate = getVideoBitrate(quality);
      int audioBitrate = 128;

      log.info("Generando calidad {} para video {}", quality, videoId);

      ProcessBuilder processBuilder = new ProcessBuilder(
          "ffmpeg",
          "-i", videoFile.getAbsolutePath(),
          "-vf", "scale=" + resolution[0] + ":" + resolution[1],
          "-c:v", "libx264",
          "-b:v", videoBitrate + "k",
          "-c:a", "aac",
          "-b:a", audioBitrate + "k",
          "-hls_time", "10",
          "-hls_playlist_type", "vod",
          "-hls_segment_filename", new File(hlsOutputDir, outputName + "_%03d.ts").getAbsolutePath(),
          outputPlaylist.getAbsolutePath()
      );

      processBuilder.redirectErrorStream(true);
      Process process = processBuilder.start();

      // Capturar salida de ffmpeg
      BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
      String line;
      StringBuilder output = new StringBuilder();
      while ((line = reader.readLine()) != null) {
        output.append(line).append("\n");
      }

      int exitCode = process.waitFor();

      if (exitCode == 0) {
        variantPlaylists.add(outputName);
        log.info("Calidad {} generada exitosamente", quality);
      } else {
        log.error("Error generando calidad {} para video {}. Exit code: {}. Output:\n{}",
                  quality, videoId, exitCode, output.toString());
      }
    }

    // Verificar que al menos una calidad se generó
    if (variantPlaylists.isEmpty()) {
      throw new RuntimeException("No se pudo generar ninguna calidad de video HLS");
    }

    log.info("Se generaron {} calidades de video", variantPlaylists.size());

    // Crear master playlist
    File masterPlaylist = new File(hlsOutputDir, "master.m3u8");
    createMasterPlaylist(masterPlaylist, variantPlaylists);

    // Subir todos los archivos HLS a S3
    return uploadHLSFiles(hlsOutputDir, videoId);
  }

  private void createMasterPlaylist(File masterFile, List<String> variantPlaylists) throws IOException {
    StringBuilder content = new StringBuilder("#EXTM3U\n#EXT-X-VERSION:3\n");

    for (String variant : variantPlaylists) {
      // Extraer calidad del nombre del playlist (playlist_360p → 360p)
      String quality = variant.replace("playlist_", "");
      int[] resolution = getResolution(quality);
      int bandwidth = getVideoBitrate(quality) * 1000 + 128000; // video + audio

      content.append("#EXT-X-STREAM-INF:BANDWIDTH=")
          .append(bandwidth)
          .append(",RESOLUTION=")
          .append(resolution[0])
          .append("x")
          .append(resolution[1])
          .append("\n")
          .append(variant)
          .append(".m3u8\n");
    }

    Files.write(masterFile.toPath(), content.toString().getBytes());
  }

  private String uploadHLSFiles360p(File hlsDir, String videoId) throws IOException {
    String folderPrefix = "videos/" + videoId + "/hls";
    String playlist360pUrl = null;

    // Subir todos los archivos .m3u8 y .ts
    for (File file : hlsDir.listFiles()) {
      if (file.isFile()) {
        String contentType = file.getName().endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T";
        String url = s3Service.uploadFile(file, folderPrefix, contentType);

        // Guardar URL del playlist_360p.m3u8
        if (file.getName().equals("playlist_360p.m3u8")) {
          playlist360pUrl = url;
        }
      }
    }

    // Retornar URL del playlist_360p.m3u8
    return playlist360pUrl;
  }

  private String uploadHLSFiles(File hlsDir, String videoId) throws IOException {
    String folderPrefix = "videos/" + videoId + "/hls";
    String masterUrl = null;

    // Subir todos los archivos .m3u8 y .ts
    for (File file : hlsDir.listFiles()) {
      if (file.isFile()) {
        String contentType = file.getName().endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/MP2T";
        String url = s3Service.uploadFile(file, folderPrefix, contentType);

        // Guardar URL del master.m3u8
        if (file.getName().equals("master.m3u8")) {
          masterUrl = url;
        }
      }
    }

    // Retornar URL del master.m3u8
    return masterUrl;
  }

  private int[] getResolution(String quality) {
    switch (quality) {
      case "360p": return new int[]{640, 360};
      case "480p": return new int[]{854, 480};
      case "720p": return new int[]{1280, 720};
      case "1080p": return new int[]{1920, 1080};
      default: return new int[]{640, 360};
    }
  }

  private int getVideoBitrate(String quality) {
    switch (quality) {
      case "360p": return 800;
      case "480p": return 1400;
      case "720p": return 2800;
      case "1080p": return 5000;
      default: return 800;
    }
  }

  private String getFileExtension(String filename) {
    if (filename == null) return "";
    int lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot) : "";
  }

  private void deleteDirectory(File directory) {
    if (directory.exists()) {
      File[] files = directory.listFiles();
      if (files != null) {
        for (File file : files) {
          if (file.isDirectory()) {
            deleteDirectory(file);
          } else {
            file.delete();
          }
        }
      }
      directory.delete();
    }
  }
}
