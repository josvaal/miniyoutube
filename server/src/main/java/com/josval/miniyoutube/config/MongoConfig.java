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

  @Override
  @Bean
  @Primary
  public MongoClient mongoClient() {
    String host = dotenv.get("MONGODB_HOST", "localhost");
    String port = dotenv.get("MONGODB_PORT", "27017");
    String database = getDatabaseName();
    String username = dotenv.get("MONGODB_USERNAME", "user");
    String password = dotenv.get("MONGODB_PASSWORD", "password");
    String authDatabase = dotenv.get("MONGODB_AUTH_DATABASE", "admin");

    String connectionString = String.format(
        "mongodb://%s:%s@%s:%s/%s?authSource=%s",
        username, password, host, port, database, authDatabase
    );

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(connectionString))
        .build();

    return MongoClients.create(settings);
  }

  @Bean
  @Primary
  public MongoTemplate mongoTemplate() {
    return new MongoTemplate(mongoClient(), getDatabaseName());
  }

  @Bean(name = "publicMongoClient")
  public MongoClient publicMongoClient() {
    String host = dotenv.get("MONGODB_HOST", "localhost");
    String port = dotenv.get("MONGODB_PORT", "27017");
    String database = getDatabaseName();
    String username = dotenv.get("MONGODB_PUBLIC_USERNAME", "public_user");
    String password = dotenv.get("MONGODB_PUBLIC_PASSWORD", "public_password");
    String authDatabase = dotenv.get("MONGODB_AUTH_DATABASE", "admin");

    String connectionString = String.format(
        "mongodb://%s:%s@%s:%s/%s?authSource=%s",
        username, password, host, port, database, authDatabase
    );

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(connectionString))
        .build();

    return MongoClients.create(settings);
  }

  @Bean(name = "publicMongoTemplate")
  public MongoTemplate publicMongoTemplate() {
    return new MongoTemplate(publicMongoClient(), getDatabaseName());
  }
}
