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
import { Upload as UploadIcon, FileVideo, ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export default function Upload() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data
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
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea un video
      if (!file.type.startsWith('video/')) {
        alert('Por favor selecciona un archivo de video válido');
        return;
      }
      // Validar tamaño (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. Máximo 500MB');
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
      alert('Por favor selecciona un video');
      return;
    }

    if (!formData.title.trim()) {
      alert('Por favor ingresa un título');
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
      onError: (error) => {
        console.error('Error al subir video:', error);
        alert('Error al subir el video. Por favor intenta de nuevo.');
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Seleccionar video</span>
          </div>
          <div className="w-12 h-0.5 bg-border"></div>
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Detalles del video</span>
          </div>
          <div className="w-12 h-0.5 bg-border"></div>
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${currentStep >= 3 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
              {currentStep >= 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
            </div>
            <span className="text-sm font-medium">Subir</span>
          </div>
        </div>
      </div>

      {/* Step 1: Select Video */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Subir video</CardTitle>
            <CardDescription>
              Selecciona el archivo de video que quieres subir
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            >
              <UploadIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Haz clic para seleccionar un video</p>
              <p className="text-sm text-muted-foreground mb-4">
                o arrastra y suelta aquí
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos soportados: MP4, AVI, MOV, WebM (Máx. 500MB)
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
            <CardDescription>
              Completa la información sobre tu video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Video Info */}
            {videoFile && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
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

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Ingresa un título descriptivo"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe tu video..."
                value={formData.description}
                onChange={handleChange}
                rows={5}
              />
            </div>

            {/* Privacy Status */}
            <div className="space-y-2">
              <Label htmlFor="privacyStatus">Privacidad</Label>
              <Select
                value={formData.privacyStatus}
                onValueChange={(value) => setFormData({ ...formData, privacyStatus: value as VideoPrivacyStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Público</SelectItem>
                  <SelectItem value="UNLISTED">No listado</SelectItem>
                  <SelectItem value="PRIVATE">Privado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.privacyStatus === 'PUBLIC' && 'Todos pueden buscar y ver tu video'}
                {formData.privacyStatus === 'UNLISTED' && 'Solo quienes tengan el enlace pueden ver tu video'}
                {formData.privacyStatus === 'PRIVATE' && 'Solo tú puedes ver tu video'}
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                name="tags"
                type="text"
                placeholder="Ejemplo: tutorial, react, programación"
                value={formData.tags}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">
                Separa las etiquetas con comas
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
            >
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
            <CardDescription>
              Por favor espera mientras se sube tu video
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                {uploadProgress}% completado
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {currentStep === 3 && !uploadVideo.isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">¡Video subido exitosamente!</CardTitle>
            <CardDescription>
              Tu video ha sido subido y está siendo procesado
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <p className="text-center text-muted-foreground">
                Serás redirigido al video en unos momentos...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
