import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useVideos } from '../hooks/useVideos';
import { Button } from '../components/ui/button';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play,
  Sparkles,
  Flame,
  Clock3,
  Compass,
  Upload,
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  const { data: videosData, isLoading, error } = useVideos(currentPage, pageSize);

  const videos = videosData?.content || [];
  const totalPages = videosData?.totalPages || 0;
  const totalElements = videosData?.totalElements || 0;

  const moodFilters = ['Todos', 'En tendencia', 'Tutoriales', 'Musica', 'Gaming', 'Noticias'];

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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] gap-3 text-center">
        <Flame className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold">Error al cargar los videos</p>
        <p className="text-muted-foreground">Hubo un problema al conectar con el servidor.</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
        <Play className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No hay videos disponibles</h2>
        <p className="text-muted-foreground mb-4">Se el primero en subir un video</p>
        <Button onClick={() => navigate('/upload')}>Subir video</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-red-500/15 via-background to-purple-500/10 p-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-orange-400" />
              Descubre tu siguiente video
            </div>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Exhibe los videos oficiales de la empresa en un feed limpio y rapido.
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Presenta lanzamientos, demos y training del equipo en un solo hub.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/upload')} className="rounded-xl px-5">
                <Upload className="mr-2 h-4 w-4" />
                Subir video
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/subscriptions')}
                className="rounded-xl"
              >
                <Compass className="mr-2 h-4 w-4" />
                Ver suscripciones
              </Button>
            </div>
          </div>
          <div className="grid w-full max-w-xs grid-cols-2 gap-3 md:max-w-sm">
            <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <p className="text-xs text-muted-foreground">Videos activos</p>
              <p className="text-2xl font-bold">{totalElements}</p>
            </div>
            <div className="rounded-2xl border bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <p className="text-xs text-muted-foreground">Paginas</p>
              <p className="text-2xl font-bold">{totalPages || 1}</p>
            </div>
            <div className="col-span-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
              <p className="text-xs text-muted-foreground">Curado para ti</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {moodFilters.slice(1, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground ring-1 ring-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {moodFilters.map((filter) => (
          <button
            key={filter}
            className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur">
                <Play className="h-4 w-4" />
                Reproducir
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white backdrop-blur">
                {video.duration || '00:00'}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
              <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition-colors group-hover:text-red-500">
                {video.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{video.channelName || 'Canal desconocido'}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1">
                  <Clock3 className="h-3 w-3" />
                  {formatDate(video.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatViews(video.views || 0)} vistas</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{video.privacyStatus === 'PRIVATE' ? 'Privado' : 'Publico'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i;
              } else if (currentPage < 3) {
                pageNumber = i;
              } else if (currentPage > totalPages - 3) {
                pageNumber = totalPages - 5 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  className="w-10"
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      <p className="text-center text-sm text-muted-foreground">
        Pagina {currentPage + 1} de {totalPages || 1}
      </p>
    </div>
  );
}
