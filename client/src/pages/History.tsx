import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { History as HistoryIcon, Loader2, AlertCircle, Play, Clock3 } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useHistory } from '../hooks/useVideos';
import { Button } from '../components/ui/button';

function formatRelative(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return 'Hace un momento';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Hace ${diffMonths} m`;
  const diffYears = Math.floor(diffMonths / 12);
  return `Hace ${diffYears} a`;
}

export default function History() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  const { data, isLoading, error } = useHistory(currentPage, pageSize);
  const items = data?.content || [];
  const totalPages = data?.totalPages || 0;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4 text-center">
        <HistoryIcon className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Inicia sesión para ver tu historial</h2>
        <p className="max-w-md text-muted-foreground">
          Guarda y retoma los videos que has visto recientemente.
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
        <p className="text-lg font-semibold">No pudimos cargar el historial</p>
        <p className="text-muted-foreground">Intenta recargar o vuelve más tarde.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-3 text-center">
        <HistoryIcon className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Aún no hay historial</p>
        <p className="text-muted-foreground">Empieza a ver videos para guardarlos aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-accent p-2">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Historial</h1>
            <p className="text-sm text-muted-foreground">Videos vistos recientemente</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={`${item.video.id}-${item.viewedAt}`}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            onClick={() => navigate(`/video/${item.video.id}`)}
          >
            <div className="relative aspect-video overflow-hidden">
              {item.video.thumbnailUrl ? (
                <img
                  src={item.video.thumbnailUrl}
                  alt={item.video.title}
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                  <Play className="h-12 w-12 text-red-500" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
                Visto {formatRelative(item.viewedAt)}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-red-500">
                {item.video.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.video.channelName || 'Canal'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1">
                  <Clock3 className="h-3 w-3" />
                  {new Date(item.video.createdAt).toLocaleDateString()}
                </span>
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
