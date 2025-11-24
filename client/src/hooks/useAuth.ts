import { useMutation } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import type { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Función para registrar un nuevo usuario
const registerUser = async (data: RegisterRequest): Promise<UserResponse> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error al registrar usuario');
  }

  return response.json();
};

// Función para iniciar sesión
const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error al iniciar sesión');
  }

  return response.json();
};

// Hook para registrar usuario
export function useRegister() {
  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Puedes guardar el usuario en localStorage si es necesario
      console.log('Usuario registrado:', data);
    },
  });
}

// Hook para iniciar sesión
export function useLogin() {
  const { login } = useAuthContext();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Actualizar el contexto de autenticación
      login(data);
    },
  });
}

// Hook para cerrar sesión
export function useLogout() {
  const { logout } = useAuthContext();

  return useMutation({
    mutationFn: async () => {
      // Limpiar el localStorage y el contexto
      logout();
      return Promise.resolve();
    },
  });
}
