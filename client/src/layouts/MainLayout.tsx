import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  Video,
  Upload,
  User,
  LogIn,
  Menu,
  Search,
  Bell,
  PlaySquare,
  History,
  ThumbsUp,
  X,
  LogOut,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthContext } from '../contexts/AuthContext';
import { useLogout } from '../hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const logout = useLogout();

  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/subscriptions', icon: Video, label: 'Suscripciones' },
  ];

  const libraryItems = [
    { path: '/history', icon: History, label: 'Historial' },
    { path: '/liked', icon: ThumbsUp, label: 'Videos que me gustan' },
  ];

  const userItems = [
    { path: '/profile', icon: User, label: 'Tu canal' },
    { path: '/upload', icon: Upload, label: 'Subir video' },
  ];

  const moodFilters = ['Para ti', 'Productividad', 'Musica', 'Noticias', 'Tech'];

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60 blur-3xl" aria-hidden>
        <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-red-500/10" />
        <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-sky-400/10" />
        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-purple-500/5" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 px-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="group rounded-xl border bg-accent/40 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>

          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-xl border bg-gradient-to-r from-red-500/15 via-red-500/10 to-orange-400/10 px-3 py-2 font-semibold text-lg shadow-sm transition hover:shadow-md"
          >
            <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-1.5 shadow-lg transition-transform group-hover:scale-105 group-hover:shadow-xl">
              <PlaySquare className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-red-500 via-orange-400 to-amber-300 bg-clip-text text-transparent">
              MiniTube
            </span>
          </Link>

          {/* Search bar desktop */}
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="relative flex w-full max-w-2xl items-center gap-2 rounded-2xl border bg-background/70 px-4 py-2 shadow-sm backdrop-blur">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar videos, canales o etiquetas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button size="sm" className="rounded-xl px-4">
                Buscar
              </Button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated && (
              <button className="group relative rounded-xl border bg-accent/60 p-2.5 transition hover:-translate-y-0.5 hover:shadow">
                <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
              </button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex items-center gap-2 rounded-xl border bg-accent/50 px-2 py-1 transition hover:shadow">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarURL} alt={user?.username} />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs">
                        {user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-xs text-muted-foreground">Cuenta</span>
                      <span className="text-sm font-semibold">{user?.username}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Tu canal</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/upload')}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Subir video</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuracion</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout.mutate(undefined, {
                        onSuccess: () => {
                          navigate('/');
                        },
                      });
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search mobile */}
        <div className="flex items-center gap-2 px-1 pb-3 md:hidden">
          <div className="relative flex w-full items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar contenido"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="hidden items-center gap-2 overflow-x-auto pb-3 pl-2 pr-3 md:flex">
          {moodFilters.map((filter) => (
            <button
              key={filter}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
            >
              {filter}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } glass-panel overflow-y-auto border-r bg-background/80 transition-all duration-300 ease-in-out dark:border-gray-800`}
        >
          <nav className="space-y-1 p-3">
            {/* Main Navigation */}
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive(item.path) ? 'text-red-500' : ''
                    }`}
                  />
                  <span className="transition-transform group-hover:translate-x-0.5">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Library Section */}
            <div className="border-t pt-3 dark:border-gray-800">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Biblioteca
              </p>
              <div className="space-y-1">
                {libraryItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="transition-transform group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="border-t pt-3 dark:border-gray-800">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tu espacio
              </p>
              <div className="space-y-1">
                {userItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-accent text-accent-foreground shadow-sm'
                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="transition-transform group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
