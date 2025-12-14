import { useNavigate } from 'react-router';
import { useVideos } from '../hooks/useVideos';
import { Button } from '../components/ui/button';
import { Loader2, Bell, Compass, Play } from 'lucide-react';

export default function Subscriptions() {
  const navigate = useNavigate();
  const { data, isLoading } = useVideos(0, 8);
  const videos = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Contenido recomendado</h1>
        <p className="text-muted-foreground">
          Consulta los ultimos videos publicados por la empresa y colecciones internas curadas.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border bg-card/80 p-4 shadow-sm">
        <Bell className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Aun no hay colecciones asignadas</p>
          <p className="text-xs text-muted-foreground">
            Agrega videos a colecciones internas y aparecera aqui.
          </p>
        </div>
        <Button onClick={() => navigate('/')} variant="outline">
          <Compass className="mr-2 h-4 w-4" />
          Explorar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                    <Play className="h-10 w-10 text-red-500" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  {video.duration || '00:00'}
                </div>
              </div>
              <div className="space-y-1 px-4 py-3">
                <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-red-500">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {video.channelName || 'Canal desconocido'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
