import { useParams, useNavigate } from 'react-router';
import { useVideo, useVideos } from '../hooks/useVideos';
import VideoPlayer from '../components/VideoPlayer';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import {
  Loader2,
  Play,
  AlertCircle,
  ThumbsUp,
  Share2,
  Clock,
  Flame,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
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
      return `Hace ${diffDays} dias`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Hace ${years} ${years === 1 ? 'ano' : 'anos'}`;
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-3 text-center">
        <AlertCircle className="h-14 w-14 text-red-500" />
        <h2 className="text-2xl font-semibold">Error al cargar el video</h2>
        <p className="text-muted-foreground">No se pudo encontrar el video solicitado.</p>
        <Button onClick={() => navigate('/')}>Volver al inicio</Button>
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
                  Tu video esta en cola para ser procesado. Esto puede tomar algunos minutos.
                </p>
              </>
            )}
            {video.processingStatus === 'PROCESSING' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                <h2 className="text-2xl font-semibold">Procesando video</h2>
                <p className="text-muted-foreground text-center">
                  Tu video se esta procesando. Esto puede tomar varios minutos dependiendo del tamano del archivo.
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player */}
        <div className="overflow-hidden rounded-2xl border bg-black shadow-xl">
          {video.hlsManifestUrl ? (
            <VideoPlayer videoUrl={video.hlsManifestUrl} posterUrl={video.thumbnailUrl} />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-muted">
              <Play className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="space-y-4 rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Flame className="h-4 w-4" />
              Recomendado para ti
            </div>
            <h1 className="text-2xl font-bold leading-tight">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1">
                <BadgeCheck className="h-4 w-4 text-primary" />
                {formatViews(video.views_count || 0)} vistas
              </div>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span>{formatDate(video.createdAt)}</span>
              {video.availableQualities && video.availableQualities.length > 0 && (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>Calidades: {video.availableQualities.join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl">
              <ThumbsUp className="h-4 w-4 mr-2" />
              {formatViews(video.likes_count || 0)}
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>

          <Separator />

          {/* Channel Info */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={video.creatorAvatarUrl} />
                <AvatarFallback>
                  {video.creatorChannelName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3
                  className="cursor-pointer font-semibold hover:text-red-500 transition-colors"
                  onClick={() => navigate(`/channel/${video.creatorId}`)}
                >
                  {video.creatorChannelName || 'Canal desconocido'}
                </h3>
                <p className="text-xs text-muted-foreground">Creador</p>
              </div>
            </div>
            <Button variant="default" className="rounded-full px-5">
              Seguir canal oficial
            </Button>
          </div>

          <Separator />

          {/* Description */}
          <div className="rounded-xl bg-muted p-4">
            <div
              className={`text-sm whitespace-pre-wrap ${
                !showFullDescription ? 'line-clamp-4' : ''
              }`}
            >
              {video.description || 'Sin descripcion'}
            </div>
            {video.description && video.description.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 px-0"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Mostrar menos' : 'Mostrar mas'}
              </Button>
            )}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {video.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground"
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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Videos relacionados</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/')}
          >
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          {relatedVideos?.content
            .filter((v) => v.id !== video.id)
            .slice(0, 8)
            .map((relatedVideo) => (
              <div
                key={relatedVideo.id}
                className="group flex cursor-pointer gap-3 rounded-2xl border bg-card/70 p-2 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                onClick={() => navigate(`/video/${relatedVideo.id}`)}
              >
                <div className="relative w-40 flex-shrink-0 overflow-hidden rounded-xl">
                  {relatedVideo.thumbnailUrl ? (
                    <img
                      src={relatedVideo.thumbnailUrl}
                      alt={relatedVideo.title}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                      <Play className="h-8 w-8 text-red-500" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">
                    {formatDuration(relatedVideo.duration_sec) ||
                      relatedVideo.duration ||
                      '00:00'}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-red-500">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {relatedVideo.creatorChannelName ||
                      relatedVideo.channelName ||
                      'Canal desconocido'}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatViews(relatedVideo.views_count || relatedVideo.views || 0)} vistas</span>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
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
