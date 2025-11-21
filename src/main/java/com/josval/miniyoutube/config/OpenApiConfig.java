package com.josval.miniyoutube.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  private static final List<String> PUBLIC_PATHS = List.of(
      "/api/auth/register",
      "/api/auth/login"
  );

  @Bean
  public OpenAPI customOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("MiniYouTube API")
            .version("1.0")
            .description("API para aplicación de videos similar a YouTube")
            .contact(new Contact()
                .name("API Support")
                .email("support@miniyoutube.com")
            )
        )
        .servers(List.of(
            new Server()
                .description("Local Environment")
                .url("http://localhost:8080")
        ))
        .components(new Components()
            .addSecuritySchemes("bearerAuth", new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT authentication")
            )
        );
  }

  @Bean
  public OperationCustomizer customizeOperationSecurity() {
    return (operation, handlerMethod) -> {
      String path = operation.getOperationId();

      // Obtener el path del endpoint desde el request mapping
      org.springframework.web.bind.annotation.RequestMapping classMapping =
          handlerMethod.getBeanType().getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);

      String basePath = (classMapping != null && classMapping.value().length > 0)
          ? classMapping.value()[0]
          : "";

      // Verificar si el endpoint es público
      boolean isPublic = PUBLIC_PATHS.stream()
          .anyMatch(publicPath -> basePath.startsWith(publicPath));

      // Si no es público, agregar requisito de seguridad
      if (!isPublic) {
        operation.addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
      }

      return operation;
    };
  }
}
