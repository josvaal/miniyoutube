import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useLogin } from '../hooks/useAuth';
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
import { PlaySquare, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          navigate('/');
        },
        onError: (err) => {
          console.error('Error al iniciar sesion:', err.message);
        },
      }
    );
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] items-center gap-6 py-6 md:grid-cols-2">
      <div className="relative hidden h-full flex-col justify-center overflow-hidden rounded-3xl border bg-gradient-to-br from-red-500/20 via-background to-purple-500/20 p-10 shadow-xl md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-2 shadow-lg">
            <PlaySquare className="h-6 w-6 text-white" />
          </div>
          MiniTube
        </div>
        <div className="relative mt-8 space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Centraliza los videos oficiales de la empresa en un solo lugar.
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Comparte lanzamientos y piezas internas con clientes y equipo desde un hub propio.
          </p>
          <div className="flex items-center gap-3 rounded-2xl border bg-background/60 p-3 text-sm shadow-sm backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Sesiones seguras y control sobre quién accede a cada video.
          </div>
        </div>
      </div>

      <Card className="w-full max-w-xl justify-self-center border bg-card/80 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar sesion</CardTitle>
          <CardDescription>
            Usa tu email y contrasena para entrar a tu cuenta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={login.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={login.isPending}
              />
            </div>
            {login.isError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40">
                {login.error.message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-4">
            <Button type="submit" className="w-full rounded-xl" disabled={login.isPending}>
              {login.isPending ? 'Iniciando sesion...' : 'Entrar'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Registrate aqui
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
