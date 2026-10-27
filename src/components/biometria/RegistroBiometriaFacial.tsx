'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Scan,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getFaceApi,
  assessFaceQuality,
  getBiometriaCliente,
  guardarBiometriaFacial,
  type FaceDetectionAssessment,
} from '@/lib/face-api-service';
import type { ClienteBiometria } from '@/types/database';

interface RegistroBiometriaFacialProps {
  clienteId?: string | null;
  clienteNombre?: string;
  isNewClient?: boolean;
  onBiometriaCapturedInMemory?: (descriptor: number[], snapshotUrl: string) => void;
  onSuccess?: (biometria: ClienteBiometria) => void;
}

export default function RegistroBiometriaFacial({
  clienteId,
  clienteNombre = 'Socio',
  isNewClient = false,
  onBiometriaCapturedInMemory,
  onSuccess,
}: RegistroBiometriaFacialProps) {
  // Estado de biometría existente
  const [existingBiometria, setExistingBiometria] = useState<ClienteBiometria | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Estados de la cámara y modelos
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Estado de detección en tiempo real
  const [assessment, setAssessment] = useState<FaceDetectionAssessment>({
    detected: false,
    score: 0,
    isIlluminated: false,
    isCentered: false,
    isGoodDistance: false,
    isReadyForCapture: false,
    message: 'Iniciando cámara...',
  });

  // Guardado / Captura
  const [capturing, setCapturing] = useState(false);
  const [capturedSuccess, setCapturedSuccess] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Referencias a elementos DOM y streams
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const latestDetectionRef = useRef<FaceDetectionAssessment | null>(null);

  // ── 1. Verificar si el socio ya tiene biometría registrada ─────────────────
  const checkExistingRecord = useCallback(async () => {
    if (!clienteId || isNewClient) return;
    setCheckingExisting(true);
    try {
      const { registrado, biometria } = await getBiometriaCliente(clienteId);
      if (registrado && biometria) {
        setExistingBiometria(biometria);
      } else {
        setExistingBiometria(null);
      }
    } catch (err) {
      console.warn('[Biometría] Error al comprobar registro existente:', err);
    } finally {
      setCheckingExisting(false);
    }
  }, [clienteId, isNewClient]);

  useEffect(() => {
    checkExistingRecord();
  }, [checkExistingRecord]);

  // ── 2. Detener cámara y limpiar streams ────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setIsCameraActive(false);
    setAssessment({
      detected: false,
      score: 0,
      isIlluminated: false,
      isCentered: false,
      isGoodDistance: false,
      isReadyForCapture: false,
      message: 'Cámara apagada',
    });
  }, []);

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── 3. Bucle de detección en tiempo real con face-api ──────────────────────
  const runDetectionLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
      return;
    }

    try {
      const faceapi = await getFaceApi();

      const displaySize = {
        width: video.videoWidth || 640,
        height: video.videoHeight || 480,
      };

      if (canvas.width !== displaySize.width || canvas.height !== displaySize.height) {
        canvas.width = displaySize.width;
        canvas.height = displaySize.height;
        faceapi.matchDimensions(canvas, displaySize);
      }

      // Detectar rostro con landmarks y descriptor
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Evaluar calidad y posición
        const quality = assessFaceQuality(detection ?? null, canvas.width, canvas.height, ctx);
        latestDetectionRef.current = quality;
        setAssessment(quality);

        if (detection) {
          const resizedDetection = faceapi.resizeResults(detection, displaySize);
          const box = resizedDetection.detection.box;

          // Dibujar marco estético y dinámico según la calidad
          const isReady = quality.isReadyForCapture;
          const strokeColor = isReady ? '#4DA65B' : '#F59E0B'; // primary-light o ámbar

          ctx.lineWidth = isReady ? 3 : 2;
          ctx.strokeStyle = strokeColor;

          // Esquinas iluminadas tipo escáner de alta tecnología
          const cornerLength = Math.min(box.width, box.height) * 0.25;
          const r = 12; // Radio de esquina
          const x = box.x;
          const y = box.y;
          const w = box.width;
          const h = box.height;

          ctx.beginPath();
          // Superior Izquierda
          ctx.moveTo(x, y + cornerLength);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.lineTo(x + cornerLength, y);

          // Superior Derecha
          ctx.moveTo(x + w - cornerLength, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + cornerLength);

          // Inferior Derecha
          ctx.moveTo(x + w, y + h - cornerLength);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + w - cornerLength, y + h);

          // Inferior Izquierda
          ctx.moveTo(x + cornerLength, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + h - cornerLength);
          ctx.stroke();

          // Puntos faciales (Landmarks) sutiles
          if (resizedDetection.landmarks) {
            ctx.fillStyle = isReady ? 'rgba(77, 166, 91, 0.7)' : 'rgba(245, 158, 11, 0.5)';
            resizedDetection.landmarks.positions.forEach((pt) => {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
              ctx.fill();
            });
          }

          // Etiqueta flotante sobre el rostro
          const scorePercent = Math.round(detection.detection.score * 100);
          const label = isReady
            ? `✓ Rostro Listo (${scorePercent}%)`
            : `Alineando... (${scorePercent}%)`;

          ctx.font = 'bold 12px sans-serif';
          const textWidth = ctx.measureText(label).width;
          const labelX = Math.max(10, x + (w - textWidth) / 2);
          const labelY = Math.max(25, y - 10);

          ctx.fillStyle = isReady ? 'rgba(37, 136, 71, 0.85)' : 'rgba(217, 119, 6, 0.85)';
          ctx.beginPath();
          ctx.roundRect(labelX - 8, labelY - 14, textWidth + 16, 20, 6);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(label, labelX, labelY);
        }
      }
    } catch (err) {
      console.warn('[Biometría Loop] Excepción en ciclo de detección:', err);
    }

    animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
  }, []);

  // ── 4. Activar cámara web y cargar modelos ─────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);
    setFeedback(null);
    setCapturedSuccess(false);

    try {
      // 1. Cargar modelos si no están precargados
      if (!modelsLoaded) {
        setLoadingModels(true);
        await getFaceApi();
        setModelsLoaded(true);
        setLoadingModels(false);
      }

      // 2. Solicitar permiso de la cámara web
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            animationFrameRef.current = requestAnimationFrame(runDetectionLoop);
          });
        };
      }
    } catch (err: unknown) {
      setLoadingModels(false);
      const e = err as { name?: string; message?: string };
      console.error('[Biometría] Error al acceder a la cámara:', err);

      let errorMsg = 'No se pudo acceder a la cámara web.';
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        errorMsg = 'Permiso denegado. Concede acceso a tu cámara web en el navegador.';
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ninguna cámara conectada en tu equipo.';
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        errorMsg = 'La cámara web ya está siendo utilizada por otra aplicación.';
      } else if (e.message) {
        errorMsg = e.message;
      }

      setCameraError(errorMsg);
      setIsCameraActive(false);
    }
  };

  // ── 5. Capturar y Guardar Biometría Facial ─────────────────────────────────
  const handleCaptureAndSave = async () => {
    const currentAssessment = latestDetectionRef.current;

    if (!currentAssessment || !currentAssessment.detected || !currentAssessment.descriptor) {
      setFeedback({
        type: 'error',
        message: 'No se detecta un rostro en el visor. Ubícate frente a la cámara.',
      });
      return;
    }

    setCapturing(true);
    setFeedback(null);

    try {
      // Capturar frame actual para snapshot de verificación
      let snapshotDataUrl = '';
      if (videoRef.current) {
        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = videoRef.current.videoWidth || 640;
        snapCanvas.height = videoRef.current.videoHeight || 480;
        const ctx = snapCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, snapCanvas.width, snapCanvas.height);
          snapshotDataUrl = snapCanvas.toDataURL('image/jpeg', 0.85);
          setCapturedSnapshot(snapshotDataUrl);
        }
      }

      const descriptor = currentAssessment.descriptor;

      // Si es un socio nuevo que aún no tiene ID en la base de datos:
      if (isNewClient || !clienteId) {
        if (onBiometriaCapturedInMemory) {
          onBiometriaCapturedInMemory(descriptor, snapshotDataUrl);
        }
        setCapturedSuccess(true);
        setFeedback({
          type: 'success',
          message: '✓ Rostro capturado. Se vinculará automáticamente al guardar el socio.',
        });
        stopCamera();
        return;
      }

      // Si ya tiene ID, guardar directamente en la tabla cliente_biometria
      const res = await guardarBiometriaFacial({
        clienteId,
        descriptor,
        proveedorSensor: 'WEB_CAMERA',
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'No se pudo guardar la biometría en la base de datos.');
      }

      setExistingBiometria(res.data);
      setCapturedSuccess(true);
      setFeedback({
        type: 'success',
        message: '✓ ¡Biometría facial registrada y guardada exitosamente!',
      });

      if (onSuccess) {
        onSuccess(res.data);
      }

      // Detener cámara al completar la captura
      stopCamera();
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('[Biometría] Error al capturar:', err);
      setFeedback({
        type: 'error',
        message: e.message || 'Error al guardar la biometría facial.',
      });
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Encabezado & Estado de Biometría Actual ──────────────────── */}
      <div className="rounded-2xl border border-surface-border bg-surface/50 p-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                existingBiometria || capturedSuccess
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-surface-border bg-background text-muted'
              }`}
            >
              <Scan className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Reconocimiento Facial
                </h3>
                {existingBiometria || capturedSuccess ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>✓ Rostro Registrado</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted">
                    <AlertCircle className="h-3 w-3" />
                    <span>Pendiente</span>
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-muted">
                {existingBiometria || capturedSuccess
                  ? `El socio ${clienteNombre} cuenta con un vector facial de 128 descriptores activo para acceso rápido.`
                  : `Captura el rostro de ${clienteNombre} usando la cámara web para habilitar el ingreso sin contacto.`}
              </p>
            </div>
          </div>

          {/* Botón Principal para Iniciar Cámara / Recapturar */}
          {!isCameraActive && (
            <button
              type="button"
              onClick={startCamera}
              disabled={checkingExisting || loadingModels}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                existingBiometria || capturedSuccess
                  ? 'border border-surface-border bg-background text-foreground hover:border-primary hover:text-primary'
                  : 'bg-primary text-white shadow-primary/20 hover:bg-primary-dark'
              }`}
            >
              {loadingModels ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-primary-light" />
                  <span>Cargando IA...</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>
                    {existingBiometria || capturedSuccess
                      ? 'Recapturar / Actualizar'
                      : '📷 Registrar Rostro con Cámara Web'}
                  </span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Mensaje de feedback / alertas */}
        {feedback && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl border p-3 text-xs ${
              feedback.type === 'success'
                ? 'border-primary/30 bg-primary/10 text-primary font-medium'
                : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{feedback.message}</span>
          </div>
        )}

        {/* Error de cámara */}
        {cameraError && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{cameraError}</p>
              <p className="mt-0.5 text-[11px] opacity-80">
                Asegúrate de permitir el acceso en el candado de la barra de direcciones del navegador.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Visor de Cámara y Detección en Tiempo Real ─────────────── */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="overflow-hidden rounded-2xl border border-surface-border bg-zinc-950 p-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="text-xs font-bold text-white tracking-wide">
                  CÁMARA WEB EN VIVO — RECONOCIMIENTO FACIAL
                </span>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                title="Cerrar cámara"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenedor relativo de Video y Canvas Superpuesto */}
            <div className="relative mt-3 aspect-video w-full overflow-hidden rounded-xl bg-black flex items-center justify-center border border-zinc-800">
              {/* Elemento de Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />

              {/* Elemento Canvas para bounding box e indicadores */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full object-cover pointer-events-none scale-x-[-1]"
              />

              {/* Overlay de retícula central orientativa */}
              {!assessment.detected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="relative h-48 w-40 rounded-3xl border-2 border-dashed border-zinc-600/70 flex items-center justify-center">
                    <Scan className="h-10 w-10 text-zinc-500/50 animate-pulse" />
                  </div>
                  <span className="mt-3 text-[11px] font-mono text-zinc-400 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                    Ubica tu rostro dentro de la guía
                  </span>
                </div>
              )}

              {/* Indicador de Calidad / Luz / Enfoque en la esquina superior */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-lg ${
                    assessment.isReadyForCapture
                      ? 'bg-primary/90 text-white border border-primary-light/40'
                      : assessment.detected
                        ? 'bg-amber-500/80 text-white border border-amber-300/30'
                        : 'bg-zinc-900/80 text-zinc-300 border border-zinc-700/50'
                  }`}
                >
                  {assessment.isReadyForCapture ? (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-current text-white animate-bounce" />
                      <span>{assessment.message}</span>
                    </>
                  ) : (
                    <>
                      <Info className="h-3.5 w-3.5" />
                      <span>{assessment.message}</span>
                    </>
                  )}
                </div>

                {assessment.detected && (
                  <div className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-mono font-bold text-white backdrop-blur-md border border-white/10">
                    Confianza: {(assessment.score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Acciones de Captura */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>
                  Extracción de descriptor vectorial (128 dimensiones) para modelo neuronal.
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={capturing}
                  className="w-1/2 sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCaptureAndSave}
                  disabled={capturing || !assessment.detected}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg transition-all ${
                    assessment.isReadyForCapture
                      ? 'bg-primary hover:bg-primary-dark shadow-primary/30 ring-2 ring-primary/40'
                      : assessment.detected
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-zinc-700 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {capturing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Capturar y Guardar Biometría</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapshot de vista previa tras captura */}
      {capturedSnapshot && !isCameraActive && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-primary/30 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedSnapshot}
              alt="Snapshot facial"
              className="h-full w-full object-cover scale-x-[-1]"
            />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Vector Facial Extraído con Éxito</span>
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              128 puntos flotantes almacenados en la tabla <code className="font-mono text-primary font-semibold">cliente_biometria</code> bajo sensor <code className="font-mono text-foreground font-medium">WEB_CAMERA</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
