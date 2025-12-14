import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '../hooks/useUser';
import { useUserVideos } from '../hooks/useVideos';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Loader2, Settings, Upload, Video, Sparkles } from 'lucide-react';

export default function Profile() {
  const { isAuthenticated, isReady } = useAuthContext();
  const navigate = useNavigate();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: videosData, isLoading: isLoadingVideos } = useUserVideos(user?.id);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isReady, navigate]);

  if (!isReady || (!isAuthenticated && isReady)) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const videos = videosData?.content || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header del canal */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-red-500/15 via-background to-purple-500/10 p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-5">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user?.avatarURL} alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-3xl">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-white/10">
                <Sparkles className="h-4 w-4 text-orange-400" />
                Canal activo
              </div>
              <h1 className="mt-3 text-3xl font-bold">{user?.channelName}</h1>
              <p className="text-muted-foreground">@{user?.username}</p>
              <p className="text-sm text-muted-foreground">
                Biblioteca interna: {videos.length} {videos.length === 1 ? 'video' : 'videos'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/profile/edit')} variant="outline" className="rounded-xl">
              <Settings className="mr-2 h-4 w-4" />
              Editar perfil
            </Button>
            <Button onClick={() => navigate('/upload')} className="rounded-xl">
              <Upload className="mr-2 h-4 w-4" />
              Subir video
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de navegacion */}
      <div className="border-b">
        <div className="flex gap-8">
          <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-red-500 text-sm font-medium">
            <Video className="h-4 w-4" />
            Videos
          </button>
        </div>
      </div>

      {/* Grid de videos */}
      <div className="py-4">
        {isLoadingVideos ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aun no hay videos</h3>
            <p className="text-muted-foreground mb-4">Sube tu primer video para ver tu canal vivo</p>
            <Button onClick={() => navigate('/upload')} className="rounded-xl">
              <Upload className="mr-2 h-4 w-4" />
              Subir video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer overflow-hidden rounded-2xl border bg-card/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                onClick={() => navigate(`/video/${video.id}`)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
                    {video.duration || '00:00'}
                  </div>
                </div>
                <div className="space-y-1 px-4 py-3">
                  <h3 className="font-semibold line-clamp-2 text-sm transition-colors group-hover:text-red-500">
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
    </div>
  );
}
