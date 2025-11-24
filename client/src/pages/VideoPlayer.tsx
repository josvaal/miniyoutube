import { useParams, useNavigate } from 'react-router';
import { useVideo, useVideos } from '../hooks/useVideos';
import VideoPlayer from '../components/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { Loader2, Play, AlertCircle, ThumbsUp, Share2, Clock } from 'lucide-react';
import { useState } from 'react';

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { data: video, isLoading, error } = useVideo(id!);
  const { data: relatedVideos } = useVideos(0, 8);

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error al cargar el video</h2>
        <p className="text-muted-foreground mb-4">
          No se pudo encontrar el video solicitado
        </p>
        <Button onClick={() => navigate('/')}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  // Handle processing status
  if (video.processingStatus !== 'COMPLETED') {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {video.processingStatus === 'PENDING' && (
              <>
                <Clock className="h-16 w-16 text-yellow-500" />
                <h2 className="text-2xl font-semibold">Video en cola</h2>
                <p className="text-muted-foreground text-center">
                  Tu video está en cola para ser procesado. Esto puede tomar algunos minutos.
                </p>
              </>
            )}
            {video.processingStatus === 'PROCESSING' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                <h2 className="text-2xl font-semibold">Procesando video</h2>
                <p className="text-muted-foreground text-center">
                  Tu video se está procesando. Esto puede tomar varios minutos dependiendo del tamaño del archivo.
                </p>
              </>
            )}
            {video.processingStatus === 'FAILED' && (
              <>
                <AlertCircle className="h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-semibold">Error al procesar</h2>
                <p className="text-muted-foreground text-center">
                  Hubo un error al procesar tu video. Por favor, intenta subirlo nuevamente.
                </p>
              </>
            )}
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">{video.title}</h3>
              <p className="text-sm text-muted-foreground">{video.description}</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {video.hlsManifestUrl ? (
            <VideoPlayer
              videoUrl={video.hlsManifestUrl}
              posterUrl={video.thumbnailUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatViews(video.views_count || 0)} vistas</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
                {video.availableQualities && video.availableQualities.length > 0 && (
                  <>
                    <span>•</span>
                    <span>Calidades: {video.availableQualities.join(', ')}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {formatViews(video.likes_count || 0)}
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Channel Info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.creatorAvatarUrl} />
                <AvatarFallback>
                  {video.creatorChannelName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3
                  className="font-semibold cursor-pointer hover:text-red-500 transition-colors"
                  onClick={() => navigate(`/channel/${video.creatorId}`)}
                >
                  {video.creatorChannelName || 'Canal desconocido'}
                </h3>
              </div>
            </div>
            <Button variant="default">Suscribirse</Button>
          </div>

          <Separator />

          {/* Description */}
          <div className="bg-muted rounded-lg p-4">
            <div className={`text-sm whitespace-pre-wrap ${!showFullDescription ? 'line-clamp-3' : ''}`}>
              {video.description || 'Sin descripción'}
            </div>
            {video.description && video.description.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 px-0"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Mostrar menos' : 'Mostrar más'}
              </Button>
            )}
            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-background px-2 py-1 rounded-full text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Related Videos */}
      <div className="lg:col-span-1">
        <h2 className="text-lg font-semibold mb-4">Videos relacionados</h2>
        <div className="space-y-3">
          {relatedVideos?.content
            .filter((v) => v.id !== video.id)
            .slice(0, 8)
            .map((relatedVideo) => (
              <div
                key={relatedVideo.id}
                className="group cursor-pointer flex gap-2"
                onClick={() => navigate(`/video/${relatedVideo.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative w-40 aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {relatedVideo.thumbnailUrl ? (
                    <img
                      src={relatedVideo.thumbnailUrl}
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                      <Play className="h-8 w-8 text-red-500" />
                    </div>
                  )}
                  {/* Duration badge */}
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(relatedVideo.duration_sec) || relatedVideo.duration || '00:00'}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-red-500 transition-colors mb-1">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    {relatedVideo.creatorChannelName || relatedVideo.channelName || 'Canal desconocido'}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <span>{formatViews(relatedVideo.views_count || relatedVideo.views || 0)} vistas</span>
                    <span className="mx-1">•</span>
                    <span>{formatDate(relatedVideo.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
