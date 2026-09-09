import React, { useState, useRef, useEffect } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { compressImageFile } from '../utils/imageUtils';
import { updateUserProfilePhotoInFirestore } from '../services/firestoreService';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Upload,
  X,
  Check,
  RotateCw,
  User as UserIcon,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface ProfilePhotoUploadProps {
  userId: string;
  userName?: string;
  currentAvatarUrl?: string;
  onPhotoUploaded?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showControls?: boolean;
  editable?: boolean;
  className?: string;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  userId,
  userName = 'Usuário',
  currentAvatarUrl,
  onPhotoUploaded,
  size = 'lg',
  showControls = true,
  editable = true,
  className = '',
}) => {
  const { updateUser, currentUser, setCurrentUser } = useApp();

  const [previewUrl, setPreviewUrl] = useState<string>(
    currentAvatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Camera Modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (currentAvatarUrl) {
      setPreviewUrl(currentAvatarUrl);
    }
  }, [currentAvatarUrl]);

  // Clean up camera stream when modal closes or unmounts
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  // Dimensions based on size prop
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
    xl: 'w-40 h-40 text-5xl',
  }[size];

  const sizePx = {
    sm: 64,
    md: 96,
    lg: 128,
    xl: 160,
  }[size];

  // Handler for File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'O arquivo é muito grande. O tamanho máximo permitido é 10MB.' });
      return;
    }

    // Immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Process and upload file
    processAndUploadFile(file);
  };

  // Open Live Camera
  const startCamera = async () => {
    setStatusMessage(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Erro ao acessar câmera do dispositivo:', err);
      // Fallback to native camera input on mobile or restricted permissions
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Não foi possível acessar a câmera. Verifique as permissões do seu navegador.',
        });
      }
      setIsCameraOpen(false);
    }
  };

  const switchCamera = async () => {
    stopCameraStream();
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Erro ao alternar câmera:', err);
    }
  };

  // Capture Snapshot from Live Camera
  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 640;

    // Crop to square
    const minDim = Math.min(videoWidth, videoHeight);
    const startX = (videoWidth - minDim) / 2;
    const startY = (videoHeight - minDim) / 2;

    canvas.width = 400;
    canvas.height = 400;

    context.drawImage(video, startX, startY, minDim, minDim, 0, 0, 400, 400);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setStatusMessage({ type: 'error', text: 'Erro ao gerar captura de imagem.' });
          return;
        }

        const file = new File([blob], `camera_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

        // Immediate local preview
        const localUrl = URL.createObjectURL(blob);
        setPreviewUrl(localUrl);

        // Stop camera modal
        stopCameraStream();
        setIsCameraOpen(false);

        // Upload to Firebase Storage & Firestore
        processAndUploadFile(file);
      },
      'image/jpeg',
      0.9
    );
  };

  // Upload Process utilizing client-side high-compression to Base64 Data URL (Fail-safe, instant & 100% reliable)
  const processAndUploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage({ type: 'info', text: 'Compactando e preparando foto de perfil...' });

    try {
      // 1. Progress animation simulation for polished UX
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 15;
        if (progress >= 90) {
          clearInterval(progressInterval);
        } else {
          setUploadProgress(progress);
        }
      }, 50);

      // 2. Compress image to super compact JPG (120px max dimension, 0.6 quality, ~4KB to 7KB size)
      const compressedBase64 = await compressImageFile(file, 120, 0.6);
      
      clearInterval(progressInterval);
      setUploadProgress(95);

      // 3. Update local preview immediately
      setPreviewUrl(compressedBase64);

      // 4. Save to Firestore (both individual user document and global state crm_state)
      if (userId) {
        setStatusMessage({ type: 'info', text: 'Salvando e sincronizando foto de perfil no Firestore...' });
        
        const successFirestore = await updateUserProfilePhotoInFirestore(userId, compressedBase64);
        if (successFirestore) {
          console.log(`Documento do usuário ${userId} atualizado no Firestore com a foto Base64.`);
        } else {
          console.warn(`Aviso: não foi possível salvar o documento isolado do usuário, sincronizando via estado global.`);
        }

        // 5. Update global app state
        updateUser(userId, { avatar: compressedBase64 });
        if (currentUser && currentUser.id === userId) {
          setCurrentUser({ ...currentUser, avatar: compressedBase64 });
        }
      }

      // 6. Invoke callback if supplied
      if (onPhotoUploaded) {
        onPhotoUploaded(compressedBase64);
      }

      setUploadProgress(100);
      setIsUploading(false);
      setStatusMessage({
        type: 'success',
        text: 'Sua foto de perfil foi salva e sincronizada na nuvem com sucesso!',
      });

      // Hide status message after 4s
      setTimeout(() => setStatusMessage(null), 4000);

    } catch (err: any) {
      console.error('Falha ao processar upload:', err);
      setIsUploading(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Ocorreu um erro inesperado ao salvar a foto de perfil.',
      });
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-3 ${className}`}>
      {/* Avatar Container with Preview & Controls */}
      <div className="relative group">
        <div
          className={`relative rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all duration-300 ${sizeClasses}`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={userName}
              className="w-full h-full object-cover"
              onError={() => {
                setPreviewUrl('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
              }}
            />
          ) : (
            <UserIcon className="w-1/2 h-1/2 text-slate-400" />
          )}

          {/* Upload Progress Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
              <RotateCw className="w-6 h-6 animate-spin text-emerald-400 mb-1" />
              <span className="text-xs font-bold">{uploadProgress}%</span>
            </div>
          )}

          {/* Hover Overlay when Editable */}
          {editable && !isUploading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white cursor-pointer"
            >
              <Camera className="w-6 h-6 mb-1 text-emerald-300" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Alterar</span>
            </div>
          )}
        </div>

        {/* Quick Action Badges */}
        {editable && !isUploading && (
          <div className="absolute bottom-0 right-0 flex gap-1 transform translate-x-1 translate-y-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Escolher Foto da Galeria / Arquivo"
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={startCamera}
              title="Tirar Foto com a Câmera"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md transition-transform hover:scale-110 active:scale-95 focus:outline-none"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="user"
        className="hidden"
      />

      {/* Controls buttons below avatar */}
      {showControls && editable && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Selecionar Foto</span>
          </button>

          <button
            type="button"
            onClick={startCamera}
            disabled={isUploading}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-blue-200 dark:border-blue-800"
          >
            <Camera className="w-3.5 h-3.5 text-blue-500" />
            <span>Tirar Foto</span>
          </button>
        </div>
      )}

      {/* Status Feedback Message */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-medium flex items-start gap-2 max-w-xs transition-all animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          ) : (
            <RotateCw className="w-4 h-4 text-blue-500 animate-spin shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-800 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Capturar Foto de Perfil</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setIsCameraOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Video Preview Box */}
            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Grid / Framing Overlay */}
              <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 rounded-full m-8 flex items-center justify-center">
                <div className="w-full h-0.5 bg-emerald-500/10" />
                <div className="h-full w-0.5 bg-emerald-500/10 absolute" />
              </div>
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-between w-full pt-2">
              <button
                type="button"
                onClick={switchCamera}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl flex items-center gap-2 text-xs font-semibold transition-colors"
                title="Alternar Câmera"
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">Alternar</span>
              </button>

              <button
                type="button"
                onClick={capturePhotoFromCamera}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-emerald-900/40 transition-all transform active:scale-95"
              >
                <Camera className="w-5 h-5" />
                <span>Capturar Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setIsCameraOpen(false);
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl text-xs font-semibold transition-colors"
              >
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
