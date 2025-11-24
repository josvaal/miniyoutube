import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';
import type { UserResponse } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Función para obtener el usuario actual
const getCurrentUser = async (token: string): Promise<UserResponse> => {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuario');
  }

  return response.json();
};

// Función para actualizar el usuario actual
const updateCurrentUser = async (
  token: string,
  data: {
    username?: string;
    email?: string;
    channelName?: string;
    avatar?: File;
  }
): Promise<UserResponse> => {
  const formData = new FormData();

  if (data.username) formData.append('username', data.username);
  if (data.email) formData.append('email', data.email);
  if (data.channelName) formData.append('channelName', data.channelName);
  if (data.avatar) formData.append('avatar', data.avatar);

  const response = await fetch(`${API_URL}/users/me`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error al actualizar usuario');
  }

  return response.json();
};

// Hook para obtener el usuario actual
export function useCurrentUser() {
  const { token, isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(token!),
    enabled: isAuthenticated && !!token,
  });
}

// Hook para actualizar el usuario actual
export function useUpdateUser() {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      username?: string;
      email?: string;
      channelName?: string;
      avatar?: File;
    }) => updateCurrentUser(token!, data),
    onSuccess: (data) => {
      // Invalida la query del usuario actual para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Actualiza el usuario en el localStorage también
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const updatedUser = {
          ...user,
          username: data.username,
          email: data.email,
          channelName: data.channelName,
          avatarURL: data.avatarURL,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    },
  });
}
