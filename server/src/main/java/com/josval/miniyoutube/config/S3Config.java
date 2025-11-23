package com.josval.miniyoutube.config;

import io.github.cdimascio.dotenv.Dotenv;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
@RequiredArgsConstructor
public class S3Config {

  private final Dotenv dotenv;

  @Bean
  public S3Client s3Client() {
    String endpoint = dotenv.get("AWS_S3_ENDPOINT", "http://localhost:4566");
    String region = dotenv.get("AWS_S3_REGION", "us-east-1");
    String accessKey = dotenv.get("AWS_S3_ACCESS_KEY", "test");
    String secretKey = dotenv.get("AWS_S3_SECRET_KEY", "test");

    return S3Client.builder()
        .endpointOverride(URI.create(endpoint))
        .region(Region.of(region))
        .credentialsProvider(StaticCredentialsProvider.create(
            AwsBasicCredentials.create(accessKey, secretKey)
        ))
        .forcePathStyle(true)  // Necesario para LocalStack
        .build();
  }

  @Bean
  public String s3BucketName() {
    return dotenv.get("AWS_S3_BUCKET_NAME", "miniyoutube");
  }
}
