import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRegister } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    channelName: '',
  });
  const register = useRegister();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    register.mutate(formData, {
      onSuccess: () => {
        navigate('/login');
      },
      onError: (error) => {
        console.error('Error al registrar:', error.message);
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
          <CardDescription>
            Completa el formulario para crear tu cuenta de MiniYouTube
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="tunombredeusuario"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={register.isPending}
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
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={register.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelName">Nombre del canal</Label>
              <Input
                id="channelName"
                name="channelName"
                type="text"
                placeholder="Mi Canal"
                value={formData.channelName}
                onChange={handleChange}
                required
                disabled={register.isPending}
              />
            </div>
            {register.isError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {register.error.message}
              </div>
            )}
            {register.isSuccess && (
              <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-950/50 rounded-md">
                ¡Cuenta creada exitosamente! Redirigiendo al login...
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={register.isPending}
            >
              {register.isPending ? 'Registrando...' : 'Registrarse'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
