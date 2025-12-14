import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useUploadVideo, type VideoPrivacyStatus, type UploadVideoData } from '../hooks/useVideos';
import { useAuthContext } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import {
  Upload as UploadIcon,
  FileVideo,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function Upload() {
  const { isAuthenticated, isReady } = useAuthContext();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    privacyStatus: 'PUBLIC' as VideoPrivacyStatus,
    tags: '',
  });

  const uploadVideo = useUploadVideo((progress) => {
    setUploadProgress(progress);
  });

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('Selecciona un archivo de video valido');
        return;
      }
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Maximo 500MB');
        return;
      }
      setVideoFile(file);
      setCurrentStep(2);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      alert('Selecciona un video');
      return;
    }

    if (!formData.title.trim()) {
      alert('Ingresa un titulo');
      return;
    }

    const uploadData: UploadVideoData = {
      title: formData.title,
      description: formData.description || undefined,
      privacyStatus: formData.privacyStatus,
      tags: formData.tags || undefined,
      video: videoFile,
    };

    uploadVideo.mutate(uploadData, {
      onSuccess: (video) => {
        setCurrentStep(3);
        setTimeout(() => {
          navigate(`/video/${video.id}`);
        }, 2000);
      },
      onError: (err) => {
        console.error('Error al subir video:', err);
        alert('Error al subir el video. Intenta de nuevo.');
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const steps = [
    { id: 1, label: 'Seleccionar video' },
    { id: 2, label: 'Detalles' },
    { id: 3, label: 'Subiendo' },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-red-500/15 via-background to-amber-500/10 p-6 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Nuevo flujo de subida
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight">Publica sin perder el contexto.</h1>
            <p className="mt-2 text-muted-foreground">
              Arrastra un video, completa los detalles y mira el progreso con feedback en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 text-sm shadow-sm backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Tamanos de hasta 500MB con seguimiento de progreso.
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-wrap items-center gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              currentStep >= step.id ? 'border-primary text-foreground' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step.id ? <CheckCircle className="h-4 w-4" /> : step.id}
            </div>
            <span className="font-medium">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Video */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Subir video</CardTitle>
            <CardDescription>Selecciona el archivo de video que quieres subir</CardDescription>
          </CardHeader>
          <CardContent className="py-12">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <UploadIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground group-hover:text-primary" />
              <p className="text-lg font-medium mb-2">Haz clic para seleccionar un video</p>
              <p className="text-sm text-muted-foreground mb-4">o arrastra y suelta aqui</p>
              <p className="text-xs text-muted-foreground">
                Formatos: MP4, AVI, MOV, WebM (Max 500MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Video Details */}
      {currentStep === 2 && !uploadVideo.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Detalles del video</CardTitle>
            <CardDescription>Completa la informacion de tu video</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {videoFile && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                <FileVideo className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{videoFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(videoFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVideoFile(null);
                    setCurrentStep(1);
                  }}
                >
                  Cambiar
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Ingresa un titulo descriptivo"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe tu video..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacyStatus">Privacidad</Label>
              <Select
                value={formData.privacyStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, privacyStatus: value as VideoPrivacyStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Publico</SelectItem>
                  <SelectItem value="UNLISTED">No listado</SelectItem>
                  <SelectItem value="PRIVATE">Privado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.privacyStatus === 'PUBLIC' && 'Todos pueden buscar y ver tu video'}
                {formData.privacyStatus === 'UNLISTED' &&
                  'Solo quienes tengan el enlace pueden ver tu video'}
                {formData.privacyStatus === 'PRIVATE' && 'Solo tu puedes ver tu video'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="Ejemplo: tutorial, react, programacion"
                value={formData.tags}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">Separa las etiquetas con comas</p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={!formData.title.trim()}>
              Subir video
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Uploading */}
      {uploadVideo.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Subiendo video...</CardTitle>
            <CardDescription>Espera mientras procesamos tu archivo</CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">{uploadProgress}% completado</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {currentStep === 3 && !uploadVideo.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">Video subido!</CardTitle>
            <CardDescription>Tu video ha sido subido y esta siendo procesado</CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-center text-muted-foreground">
                Seras redirigido al video en unos momentos...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
