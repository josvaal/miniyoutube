package com.josval.miniyoutube.security;

import io.github.cdimascio.dotenv.Dotenv;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminAuthenticationProvider implements AuthenticationProvider {

  private final Dotenv dotenv;

  @Override
  public Authentication authenticate(Authentication authentication) throws AuthenticationException {
    String username = authentication.getName();
    String password = authentication.getCredentials() != null ? authentication.getCredentials().toString() : "";

    String expectedUser = dotenv.get("MONGODB_ADMIN_USERNAME", "admin");
    String expectedPass = dotenv.get("MONGODB_ADMIN_PASSWORD", "admin");

    if (expectedUser.equals(username) && expectedPass.equals(password)) {
      return new UsernamePasswordAuthenticationToken(username, password, Collections.emptyList());
    }

    throw new BadCredentialsException("Credenciales de administrador inválidas");
  }

  @Override
  public boolean supports(Class<?> authentication) {
    return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
  }
}

