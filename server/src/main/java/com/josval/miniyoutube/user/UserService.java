package com.josval.miniyoutube.user;

import com.josval.miniyoutube.security.JwtService;
import com.josval.miniyoutube.service.S3Service;
import com.josval.miniyoutube.user.dto.LoginRequest;
import com.josval.miniyoutube.user.dto.LoginResponse;
import com.josval.miniyoutube.user.dto.RegisterRequest;
import com.josval.miniyoutube.user.dto.UpdateUserRequest;
import com.josval.miniyoutube.user.dto.UserResponse;
import java.util.ArrayList;
import java.util.Date;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final AuthenticationManager authenticationManager;
  private final S3Service s3Service;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

    var authorities = new ArrayList<SimpleGrantedAuthority>();
    if (user.getRoles() != null) {
      for (String role : user.getRoles()) {
        authorities.add(new SimpleGrantedAuthority(role));
      }
    }

    return new User(user.getEmail(), user.getPassword(), authorities);
  }

  public UserResponse register(RegisterRequest request) {
    // Validar que el email no exista
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya esta registrado");
    }

    // Validar que el username no exista
    if (userRepository.existsByUsername(request.getUsername())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "El username ya esta en uso");
    }

    // Crear nuevo usuario
    UserEntity user = new UserEntity();
    user.setUsername(request.getUsername());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setChannelName(request.getChannelName());
    user.setRoles(java.util.List.of("AUTENTICADO"));
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

  public UserResponse updateCurrentUser(String email, UpdateUserRequest request, MultipartFile avatar) {
    UserEntity user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    // Validar username único si se está actualizando
    if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
      if (userRepository.existsByUsername(request.getUsername())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "El username ya esta en uso");
      }
      user.setUsername(request.getUsername());
    }

    // Validar email único si se está actualizando
    if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
      if (userRepository.existsByEmail(request.getEmail())) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya esta registrado");
      }
      user.setEmail(request.getEmail());
    }

    // Actualizar channelName
    if (request.getChannelName() != null) {
      user.setChannelName(request.getChannelName());
    }

    // Subir avatar a S3 si se proporciona
    if (avatar != null && !avatar.isEmpty()) {
      // Eliminar avatar anterior si existe
      if (user.getAvatarURL() != null && !user.getAvatarURL().isEmpty()) {
        try {
          s3Service.deleteFile(user.getAvatarURL());
        } catch (Exception e) {
          // Log error but continue
        }
      }

      // Subir nuevo avatar
      String avatarUrl = s3Service.uploadFile(avatar, "avatar");
      user.setAvatarURL(avatarUrl);
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
