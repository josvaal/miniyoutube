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
  Settings
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

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const logout = useLogout();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="group rounded-full p-2.5 transition-all duration-200 hover:bg-accent/80"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>

          <Link
            to="/"
            className="group flex items-center gap-2.5 font-bold text-xl transition-transform hover:scale-105"
          >
            <div className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 p-1.5 shadow-lg transition-shadow group-hover:shadow-xl">
              <PlaySquare className="h-6 w-6 text-white" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              MiniTube
            </span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="relative flex w-full max-w-2xl">
            <input
              type="text"
              placeholder="Buscar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-l-full border border-r-0 bg-background px-5 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button className="group rounded-r-full border bg-accent px-6 py-2.5 transition-all hover:bg-accent/80 dark:border-gray-700">
              <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {isAuthenticated && (
            <button className="group relative rounded-full p-2.5 transition-all hover:bg-accent">
              <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
            </button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 rounded-full p-1 transition-all hover:bg-accent">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarURL} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                  <span>Configuración</span>
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
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all hover:bg-accent dark:border-gray-700"
            >
              <LogIn className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } overflow-y-auto border-r bg-background transition-all duration-300 ease-in-out dark:border-gray-800`}
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
                  <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive(item.path) ? 'text-red-500' : ''
                  }`} />
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
                Tú
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
