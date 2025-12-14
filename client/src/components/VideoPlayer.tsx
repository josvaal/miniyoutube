import { useEffect, useLayoutEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import type Player from 'video.js/dist/types/player';

interface VideoPlayerProps {
  videoUrl: string;
  posterUrl?: string;
  onReady?: (player: Player) => void;
}

export default function VideoPlayer({ videoUrl, posterUrl, onReady }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Asegurarse de que el elemento existe
    if (!videoRef.current || !containerRef.current) {
      return;
    }

    // Verificar si ya existe un player y no está disposed
    if (playerRef.current && !playerRef.current.isDisposed()) {
      // Solo actualizar la fuente si cambió la URL
      const player = playerRef.current;
      console.log('Player ya existe, actualizando fuente:', videoUrl);
      player.src({
        src: videoUrl,
        type: 'application/x-mpegURL',
      });
      if (posterUrl) {
        player.poster(posterUrl);
      }
      return;
    }

    // Si ya inicializamos pero el player fue disposed por Strict Mode, no reinicializar
    if (isInitializedRef.current) {
      console.log('Player ya fue inicializado previamente, saltando reinicialización');
      return;
    }

    const videoElement = videoRef.current;
    const container = containerRef.current;

    console.log('Inicializando video.js con URL:', videoUrl);
    const rect = container.getBoundingClientRect();
    console.log('Dimensiones del contenedor:', { width: rect.width, height: rect.height });

    // Inicializar video.js
    const player = videojs(videoElement, {
      autoplay: false,
      controls: true,
      fluid: true, // mantiene relación de aspecto
      aspectRatio: '16:9',
      preload: 'auto',
      poster: posterUrl,
      liveui: false,
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [{
        src: videoUrl,
        type: 'application/x-mpegURL',
      }],
    });

    playerRef.current = player;
    isInitializedRef.current = true;

    // Event listeners para debugging
    player.ready(() => {
      console.log('Video.js player ready');
      console.log('Player dimensions:', {
        width: player.currentWidth(),
        height: player.currentHeight(),
      });
      if (onReady) {
        onReady(player);
      }
    });

    player.on('error', (e) => {
      console.error('Video.js error:', e);
      const error = player.error();
      if (error) {
        console.error('Error details:', {
          code: error.code,
          message: error.message,
        });
      }
    });

    player.on('loadstart', () => {
      console.log('Video load started');
    });

    player.on('loadedmetadata', () => {
      console.log('Video metadata loaded');
      console.log('Video duration:', player.duration());
    });

    player.on('loadeddata', () => {
      console.log('Video data loaded - first frame ready');
    });

    // Cleanup al desmontar - SOLO en unmount real, no en Strict Mode remount
    return () => {
      // NO hacer dispose aquí para evitar problemas con Strict Mode
      // El player se limpiará cuando el componente se desmonte definitivamente
    };
  }, [videoUrl, posterUrl, onReady]);

  return (
    <div
      ref={containerRef}
      data-vjs-player
      className="relative w-full aspect-video"
    >
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-16-9 h-full w-full"
      />
    </div>
  );
}
