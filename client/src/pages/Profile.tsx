import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser } from '../hooks/useUser';
import { useUserVideos } from '../hooks/useVideos';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Loader2, Settings, Upload, Video } from 'lucide-react';

export default function Profile() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: videosData, isLoading: isLoadingVideos } = useUserVideos(user?.id);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const videos = videosData?.content || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header del canal */}
      <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg p-8">
        <div className="flex items-start gap-6">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={user?.avatarURL} alt={user?.username} />
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-4xl">
              {user?.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{user?.channelName}</h1>
            <p className="text-muted-foreground mb-4">@{user?.username}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/profile/edit')} variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Editar perfil
              </Button>
              <Button onClick={() => navigate('/upload')}>
                <Upload className="mr-2 h-4 w-4" />
                Subir video
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
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
            <h3 className="text-xl font-semibold mb-2">No hay videos todavía</h3>
            <p className="text-muted-foreground mb-4">
              Sube tu primer video para que aparezca aquí
            </p>
            <Button onClick={() => navigate('/upload')}>
              <Upload className="mr-2 h-4 w-4" />
              Subir video
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/video/${video.id}`)}
              >
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-2">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {/* Aquí podrías agregar la duración del video si está disponible */}
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-red-500 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(video.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
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
