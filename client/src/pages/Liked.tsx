import { useNavigate } from 'react-router';
import { Heart, Play, Loader2 } from 'lucide-react';
import { useLikedVideos } from '../hooks/useVideos';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
};

const formatViews = (views?: number) => {
  if (!views) return '0';
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
};

export default function Liked() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { data, isLoading, error } = useLikedVideos(0, 24);

  if (!isAuthenticated) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2">Inicia sesión para ver tus me gusta</h2>
        <p className="text-muted-foreground mb-4">Organiza los videos que has marcado con like.</p>
        <Button onClick={() => navigate('/login')}>Ir a login</Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-2">No pudimos cargar tus me gusta</h2>
        <p className="text-muted-foreground">Intenta nuevamente en unos segundos.</p>
      </Card>
    );
  }

  const videos = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Videos que me gustan</h1>
          <p className="text-muted-foreground">Todo lo que has marcado con like.</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-xl font-semibold">Aún no tienes videos con like</h3>
          <p className="text-muted-foreground">Marca tus favoritos para verlos aquí.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="group cursor-pointer overflow-hidden border bg-card/70 transition hover:-translate-y-1 hover:shadow-md"
              onClick={() => navigate(`/video/${video.id}`)}
            >
              <div className="relative aspect-video overflow-hidden">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <Play className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {video.duration_sec !== undefined && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                    {Math.floor((video.duration_sec || 0) / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {((video.duration_sec || 0) % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="line-clamp-2 font-semibold leading-tight group-hover:text-red-500">
                      {video.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {video.creatorChannelName || 'Canal desconocido'} • {formatViews(video.views_count || video.views)} vistas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>Marcado: {formatDate(video.reactedAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
