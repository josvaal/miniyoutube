import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useVideos } from '../hooks/useVideos';
import { Button } from '../components/ui/button';
import { Loader2, ChevronLeft, ChevronRight, Play } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 12;

  const { data: videosData, isLoading, error } = useVideos(currentPage, pageSize);

  const videos = videosData?.content || [];
  const totalPages = videosData?.totalPages || 0;
  const totalElements = videosData?.totalElements || 0;

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <p className="text-red-500 mb-4">Error al cargar los videos</p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
        <Play className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No hay videos disponibles</h2>
        <p className="text-muted-foreground mb-4">
          Sé el primero en subir un video
        </p>
        <Button onClick={() => navigate('/upload')}>
          Subir video
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inicio</h1>
          <p className="text-muted-foreground mt-1">
            {totalElements} {totalElements === 1 ? 'video' : 'videos'} en total
          </p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group cursor-pointer"
            onClick={() => navigate(`/video/${video.id}`)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
                  <Play className="h-12 w-12 text-red-500" />
                </div>
              )}
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {video.duration || '00:00'}
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-2">
              <h3 className="font-semibold line-clamp-2 text-sm leading-tight group-hover:text-red-500 transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{video.channelName || 'Canal desconocido'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatViews(video.views || 0)} vistas</span>
                <span>•</span>
                <span>{formatDate(video.createdAt)}</span>
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
        Página {currentPage + 1} de {totalPages}
      </p>
    </div>
  );
}
