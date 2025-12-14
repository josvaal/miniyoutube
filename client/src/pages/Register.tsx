import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRegister } from '../hooks/useAuth';
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
import { Sparkles } from 'lucide-react';

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
      onError: (err) => {
        console.error('Error al registrar:', err.message);
      },
    });
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] items-center gap-8 py-6 md:grid-cols-2">
      <Card className="w-full max-w-xl justify-self-center border bg-card/80 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>
            Completa la informacion para unirte a MiniTube
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
                placeholder="tunombre"
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
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
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
                placeholder="Mi canal"
                value={formData.channelName}
                onChange={handleChange}
                required
                disabled={register.isPending}
              />
            </div>
            {register.isError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40">
                {register.error.message}
              </div>
            )}
            {register.isSuccess && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-950/40">
                Cuenta creada exitosamente. Redirigiendo al login...
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button type="submit" className="w-full rounded-xl" disabled={register.isPending}>
              {register.isPending ? 'Registrando...' : 'Registrarse'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Inicia sesion aqui
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      <div className="relative hidden h-full flex-col justify-center overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-500/15 via-background to-green-400/10 p-10 shadow-xl md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Registro interno
        </div>
        <div className="relative mt-6 space-y-3">
          <h2 className="text-3xl font-bold leading-tight">Sube y distribuye los videos oficiales.</h2>
          <p className="max-w-xl text-muted-foreground">
            Presenta productos, campañas o training de la empresa desde un hub único.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border bg-background/70 p-3 shadow-sm backdrop-blur">
              Lanzamientos alineados
            </div>
            <div className="rounded-2xl border bg-background/70 p-3 shadow-sm backdrop-blur">
              Acceso controlado
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
