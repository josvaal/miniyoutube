import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useCurrentUser, useUpdateUser } from '../hooks/useUser';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Camera, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ProfileEdit() {
  const { isAuthenticated, isReady, login } = useAuthContext();
  const navigate = useNavigate();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const updateUser = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    channelName: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isReady, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        channelName: user.channelName || '',
      });
      if (user.avatarURL) {
        setAvatarPreview(user.avatarURL);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: {
      username?: string;
      email?: string;
      channelName?: string;
      avatar?: File;
    } = {};

    if (formData.username !== user?.username) {
      updateData.username = formData.username;
    }
    if (formData.email !== user?.email) {
      updateData.email = formData.email;
    }
    if (formData.channelName !== user?.channelName) {
      updateData.channelName = formData.channelName;
    }
    if (avatarFile) {
      updateData.avatar = avatarFile;
    }

    updateUser.mutate(updateData, {
      onSuccess: (data) => {
        if (user) {
          login({
            token: localStorage.getItem('token') || '',
            userId: user.id,
            username: data.username,
            email: data.email,
            channelName: data.channelName,
            avatarURL: data.avatarURL,
          });
        }
        navigate('/profile');
      },
      onError: (err) => {
        console.error('Error al actualizar perfil:', err.message);
      },
    });
  };

  if (!isReady || (!isAuthenticated && isReady) || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate('/profile')} className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al perfil
      </Button>

      <Card className="w-full border bg-card/80 shadow-xl backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Editar perfil</CardTitle>
          <CardDescription>Actualiza tu informacion personal y de canal</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={avatarPreview} alt={formData.username} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-4xl">
                    {formData.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground">Haz clic en la imagen para cambiar tu avatar</p>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={updateUser.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={updateUser.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channelName">Nombre del canal</Label>
                <Input
                  id="channelName"
                  name="channelName"
                  type="text"
                  placeholder="Nombre de tu canal"
                  value={formData.channelName}
                  onChange={handleChange}
                  required
                  disabled={updateUser.isPending}
                />
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <p className="text-sm font-medium">Informacion de la cuenta</p>
              <p className="text-xs text-muted-foreground">
                Creado el:{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">ID de usuario: {user?.id}</p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Datos encriptados y sincronizados.
              </div>
            </div>

            {updateUser.isError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {updateUser.error.message}
              </div>
            )}
            {updateUser.isSuccess && (
              <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-950/50 rounded-md">
                Perfil actualizado exitosamente!
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 rounded-xl" disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
              disabled={updateUser.isPending}
            >
              Cancelar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
