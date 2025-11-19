package com.josval.miniyoutube.user;

import com.josval.miniyoutube.security.JwtService;
import com.josval.miniyoutube.user.dto.LoginRequest;
import com.josval.miniyoutube.user.dto.LoginResponse;
import com.josval.miniyoutube.user.dto.RegisterRequest;
import com.josval.miniyoutube.user.dto.UserResponse;
import java.util.ArrayList;
import java.util.Date;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

    return new User(user.getEmail(), user.getPassword(), new ArrayList<>());
  }

  public UserResponse register(RegisterRequest request) {
    // Validar que el email no exista
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new RuntimeException("El email ya está registrado");
    }

    // Validar que el username no exista
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new RuntimeException("El username ya está en uso");
    }

    // Crear nuevo usuario
    UserEntity user = new UserEntity();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setChannelName(request.getChannelName());
    user.setCreatedAt(new Date());

    UserEntity savedUser = userRepository.save(user);

    return mapToUserResponse(savedUser);
  }

  public LoginResponse login(LoginRequest request) {
    // Autenticar usuario
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getEmail(),
            request.getPassword()
        )
    );

    // Cargar usuario
    UserEntity user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

    // Generar token
    UserDetails userDetails = loadUserByUsername(request.getEmail());
    String token = jwtService.generateToken(userDetails);

    // Crear respuesta
    LoginResponse response = new LoginResponse();
    response.setToken(token);
    response.setUserId(user.getId());
    response.setUsername(user.getUsername());
    response.setEmail(user.getEmail());
    response.setChannelName(user.getChannelName());
    response.setAvatarURL(user.getAvatarURL());

    return response;
  }

  public UserResponse getUserById(String userId) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    return mapToUserResponse(user);
  }

  public UserResponse updateUser(String userId, UserResponse userResponse) {
    UserEntity user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    if (userResponse.getUsername() != null) {
      user.setUsername(userResponse.getUsername());
    }
    if (userResponse.getChannelName() != null) {
      user.setChannelName(userResponse.getChannelName());
    }
    if (userResponse.getAvatarURL() != null) {
      user.setAvatarURL(userResponse.getAvatarURL());
    }

    UserEntity updatedUser = userRepository.save(user);
    return mapToUserResponse(updatedUser);
  }

  private UserResponse mapToUserResponse(UserEntity user) {
    UserResponse response = new UserResponse();
    response.setId(user.getId());
    response.setUsername(user.getUsername());
    response.setEmail(user.getEmail());
    response.setChannelName(user.getChannelName());
    response.setAvatarURL(user.getAvatarURL());
    response.setCreatedAt(user.getCreatedAt());
    return response;
  }
}
