import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../contexts/AuthContext';

// Tipos de ejemplo (ajusta segun tu API)
interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  hlsManifestUrl?: string;
  userId: string;
  createdAt: string;
  duration?: string;
  views?: number;
  channelName?: string;
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  availableQualities?: string[];
  duration_sec?: number;
  creatorId?: string;
  creatorChannelName?: string;
  creatorAvatarUrl?: string;
  privacyStatus?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  tags?: string[];
  views_count?: number;
  likes_count?: number;
  dislikes_count?: number;
}

export type VideoPrivacyStatus = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export interface UploadVideoData {
  title: string;
  description?: string;
  privacyStatus?: VideoPrivacyStatus;
  tags?: string;
  video: File;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// API base URL - ajusta segun tu configuracion
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Funcion para obtener todos los videos con paginacion
const fetchVideos = async (page: number = 0, size: number = 12): Promise<PageResponse<Video>> => {
  const response = await fetch(`${API_URL}/videos?page=${page}&size=${size}`);
  if (!response.ok) {
    throw new Error('Error al obtener videos');
  }
  return response.json();
};

// Funcion para obtener un video por ID
const fetchVideoById = async (id: string): Promise<Video> => {
  const response = await fetch(`${API_URL}/videos/${id}`);
  if (!response.ok) {
    throw new Error('Error al obtener el video');
  }
  return response.json();
};

// Hook para obtener todos los videos con paginacion
export function useVideos(page: number = 0, size: number = 12) {
  return useQuery({
    queryKey: ['videos', page, size],
    queryFn: () => fetchVideos(page, size),
  });
}

// Hook para obtener un video especifico
export function useVideo(id: string) {
  return useQuery({
    queryKey: ['videos', id],
    queryFn: () => fetchVideoById(id),
    enabled: !!id, // Solo ejecuta la query si hay un ID
  });
}

// Hook para crear un nuevo video
export function useCreateVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoData: FormData) => {
      const response = await fetch(`${API_URL}/videos`, {
        method: 'POST',
        body: videoData,
        // No establezcas Content-Type aqui; fetch lo gestiona con FormData
      });

      if (!response.ok) {
        throw new Error('Error al crear el video');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida la cache de videos para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Hook para eliminar un video
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (videoId: string) => {
      const response = await fetch(`${API_URL}/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el video');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

// Funcion para obtener videos de un usuario especifico
const fetchUserVideos = async (
  userId: string,
  page: number = 0,
  size: number = 10
): Promise<{ content: Video[]; totalElements: number }> => {
  const response = await fetch(`${API_URL}/videos?userId=${userId}&page=${page}&size=${size}`);
  if (!response.ok) {
    throw new Error('Error al obtener videos del usuario');
  }
  return response.json();
};

// Hook para obtener videos de un usuario
export function useUserVideos(userId: string | undefined, page: number = 0, size: number = 10) {
  return useQuery({
    queryKey: ['userVideos', userId, page, size],
    queryFn: () => fetchUserVideos(userId!, page, size),
    enabled: !!userId,
  });
}

// Funcion para subir un video
const uploadVideo = async (
  token: string,
  data: UploadVideoData,
  onProgress?: (progress: number) => void
): Promise<Video> => {
  const formData = new FormData();

  formData.append('title', data.title);
  if (data.description) formData.append('description', data.description);
  if (data.privacyStatus) formData.append('privacyStatus', data.privacyStatus);
  if (data.tags) formData.append('tags', data.tags);
  formData.append('video', data.video);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Error al parsear la respuesta'));
        }
      } else {
        reject(new Error(`Error al subir video: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Error de red al subir video'));
    });

    xhr.open('POST', `${API_URL}/videos`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};

// Hook para subir un video
export function useUploadVideo(onProgress?: (progress: number) => void) {
  const { token } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UploadVideoData) => uploadVideo(token!, data, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['userVideos'] });
    },
  });
}
