import { useParams, useNavigate } from 'react-router';
import { useUserVideos } from '../hooks/useVideos';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Loader2, Play, BellPlus, ArrowLeft } from 'lucide-react';

export default function Channel() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useUserVideos(userId);
  const videos = data?.content || [];

  const fallbackName = `Canal ${userId?.slice(0, 6) || ''}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-sky-500/15 via-background to-indigo-500/10 p-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-background shadow">
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                {fallbackName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Canal</p>
              <h1 className="text-2xl font-bold leading-tight">
                {videos[0]?.creatorChannelName || fallbackName}
              </h1>
              <p className="text-xs text-muted-foreground">{videos.length} videos publicados</p>
            </div>
          </div>
          <Button className="rounded-full" variant="outline">
            <BellPlus className="mr-2 h-4 w-4" />
            Suscribirse
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card/70 p-10 text-center shadow-sm">
          <Play className="h-14 w-14 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Aun no hay videos en este canal</h3>
          <p className="text-muted-foreground text-sm">Vuelve pronto para descubrir contenido.</p>
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
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
                    <Play className="h-10 w-10 text-sky-500" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                  {video.duration || '00:00'}
                </div>
              </div>
              <div className="space-y-1 px-4 py-3">
                <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-sky-500">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(video.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
