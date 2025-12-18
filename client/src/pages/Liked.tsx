import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ThumbsUp, Loader2, AlertCircle, Play, Heart } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useLikedVideos } from '../hooks/useVideos';
import { Button } from '../components/ui/button';

export default function Liked() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  const { data, isLoading, error } = useLikedVideos(currentPage, pageSize);
  const videos = data?.content || [];
  const totalPages = data?.totalPages || 0;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 text-center">
        <ThumbsUp className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Inicia sesión para ver tus videos que te gustan</h2>
        <p className="max-w-md text-muted-foreground">
          Guarda tus videos favoritos y accede rápidamente a ellos.
        </p>
        <Link to="/login">
          <Button className="rounded-xl">Entrar</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-lg font-semibold">No pudimos cargar los videos que te gustan</p>
        <p className="text-muted-foreground">Intenta recargar o vuelve más tarde.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3 text-center">
        <ThumbsUp className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Aún no tienes videos en “Me gustan”</p>
        <p className="text-muted-foreground">Dale like a tus videos favoritos para guardarlos aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-accent p-2">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Videos que me gustan</h1>
          <p className="text-sm text-muted-foreground">Todo lo que has marcado con like</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
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
                  <Play className="h-12 w-12 text-red-500" />
                </div>
              )}
              <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
                {video.duration || '00:00'}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-red-500">
                {video.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{video.channelName || 'Canal'}</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="rounded-xl"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="rounded-xl"
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
