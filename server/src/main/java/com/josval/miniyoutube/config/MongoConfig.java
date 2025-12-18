package com.josval.miniyoutube.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.github.cdimascio.dotenv.Dotenv;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.core.MongoTemplate;

@Configuration
@RequiredArgsConstructor
public class MongoConfig extends AbstractMongoClientConfiguration {

  private final Dotenv dotenv;

  @Override
  protected String getDatabaseName() {
    return dotenv.get("MONGODB_DATABASE", "miniyoutube");
  }

  private String buildConnectionString(String username, String password, String authDatabase) {
    String host = dotenv.get("MONGODB_HOST", "localhost");
    String port = dotenv.get("MONGODB_PORT", "27017");
    String database = getDatabaseName();

    return String.format(
        "mongodb://%s:%s@%s:%s/%s?authSource=%s",
        username, password, host, port, database, authDatabase
    );
  }

  @Override
  @Bean
  @Primary
  public MongoClient mongoClient() {
    String username = dotenv.get("MONGODB_USERNAME", "user");
    String password = dotenv.get("MONGODB_PASSWORD", "password");
    String authDatabase = dotenv.get("MONGODB_AUTH_DATABASE", "admin");

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(buildConnectionString(username, password, authDatabase)))
        .build();

    return MongoClients.create(settings);
  }

  @Bean
  @Primary
  public MongoTemplate mongoTemplate() {
    return new MongoTemplate(mongoClient(), getDatabaseName());
  }

  @Bean(name = "adminMongoClient")
  public MongoClient adminMongoClient() {
    String username = dotenv.get("MONGODB_ADMIN_USERNAME", "admin");
    String password = dotenv.get("MONGODB_ADMIN_PASSWORD", "admin");
    String authDatabase = dotenv.get("MONGODB_ADMIN_AUTH_DATABASE", "admin");

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(buildConnectionString(username, password, authDatabase)))
        .build();

    return MongoClients.create(settings);
  }

  @Bean(name = "adminMongoTemplate")
  public MongoTemplate adminMongoTemplate() {
    return new MongoTemplate(adminMongoClient(), getDatabaseName());
  }

  @Bean(name = "publicMongoClient")
  public MongoClient publicMongoClient() {
    // Se reutiliza el usuario de la app para evitar usuarios adicionales en BD.
    String username = dotenv.get("MONGODB_USERNAME", "app_user");
    String password = dotenv.get("MONGODB_PASSWORD", "app_password");
    String authDatabase = dotenv.get("MONGODB_AUTH_DATABASE", "admin");

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(buildConnectionString(username, password, authDatabase)))
        .build();

    return MongoClients.create(settings);
  }

  @Bean(name = "publicMongoTemplate")
  public MongoTemplate publicMongoTemplate() {
    return new MongoTemplate(publicMongoClient(), getDatabaseName());
  }
}
