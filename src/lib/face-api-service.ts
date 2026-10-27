'use client';

import type * as FaceApiType from '@vladmandic/face-api';
import { supabase } from '@/lib/supabase';
import type { ClienteBiometria } from '@/types/database';

let faceapiInstance: typeof FaceApiType | null = null;
let modelsLoadingPromise: Promise<typeof FaceApiType> | null = null;

/**
 * Carga dinámica de @vladmandic/face-api solo en el navegador (client-side)
 * para evitar problemas de SSR en Next.js.
 */
export async function getFaceApi(): Promise<typeof FaceApiType> {
  if (faceapiInstance) return faceapiInstance;

  if (typeof window === 'undefined') {
    throw new Error('face-api solo puede ejecutarse en el navegador.');
  }

  if (!modelsLoadingPromise) {
    modelsLoadingPromise = (async () => {
      // Importación dinámica ESM en el navegador
      const faceapi = await import('@vladmandic/face-api');
      faceapiInstance = faceapi;

      const modelPath = '/models';

      // Cargar modelos requeridos para detección, landmarks y descriptores de 128 posiciones
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
      ]);

      return faceapi;
    })();
  }

  return modelsLoadingPromise;
}

export interface FaceDetectionAssessment {
  detected: boolean;
  score: number;
  isIlluminated: boolean;
  isCentered: boolean;
  isGoodDistance: boolean;
  isReadyForCapture: boolean;
  message: string;
  descriptor?: number[];
  detection?: FaceApiType.WithFaceDescriptor<
    FaceApiType.WithFaceLandmarks<
      { detection: FaceApiType.FaceDetection },
      FaceApiType.FaceLandmarks68
    >
  >;
}

/**
 * Evalúa la calidad del rostro en el frame de video actual:
 * posición, tamaño, luminosidad y confianza del modelo.
 */
export function assessFaceQuality(
  detection: FaceApiType.WithFaceDescriptor<
    FaceApiType.WithFaceLandmarks<
      { detection: FaceApiType.FaceDetection },
      FaceApiType.FaceLandmarks68
    >
  > | null,
  videoWidth: number,
  videoHeight: number,
  canvasContext?: CanvasRenderingContext2D | null
): FaceDetectionAssessment {
  if (!detection) {
    return {
      detected: false,
      score: 0,
      isIlluminated: false,
      isCentered: false,
      isGoodDistance: false,
      isReadyForCapture: false,
      message: 'Buscando rostro... Posiciónate frente a la cámara',
    };
  }

  const { box, score } = detection.detection;

  // 1. Confianza del modelo
  const isGoodScore = score >= 0.55;

  // 2. Tamaño relativo del rostro (distancia adecuada)
  const faceAreaRatio = (box.width * box.height) / (videoWidth * videoHeight);
  const isTooFar = faceAreaRatio < 0.04 || box.width < 90;
  const isTooClose = faceAreaRatio > 0.65 || box.width > videoWidth * 0.85;
  const isGoodDistance = !isTooFar && !isTooClose;

  // 3. Centrado dentro del marco
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const targetCenterX = videoWidth / 2;
  const targetCenterY = videoHeight / 2;
  const deltaX = Math.abs(centerX - targetCenterX) / videoWidth;
  const deltaY = Math.abs(centerY - targetCenterY) / videoHeight;
  const isCentered = deltaX < 0.25 && deltaY < 0.25;

  // 4. Estimación de luminosidad en el área facial
  let isIlluminated = true;
  if (canvasContext && box.width > 10 && box.height > 10) {
    try {
      const startX = Math.max(0, Math.floor(box.x));
      const startY = Math.max(0, Math.floor(box.y));
      const sampleWidth = Math.min(videoWidth - startX, Math.floor(box.width));
      const sampleHeight = Math.min(videoHeight - startY, Math.floor(box.height));

      if (sampleWidth > 0 && sampleHeight > 0) {
        const imgData = canvasContext.getImageData(startX, startY, sampleWidth, sampleHeight);
        let totalBrightness = 0;
        const step = 4 * 4; // Muestreo eficiente cada 4 píxeles
        let count = 0;
        for (let i = 0; i < imgData.data.length; i += step) {
          const r = imgData.data[i];
          const g = imgData.data[i + 1];
          const b = imgData.data[i + 2];
          // Luminancia perceptual
          totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
          count++;
        }
        const avgBrightness = count > 0 ? totalBrightness / count : 128;
        // Brillo aceptable entre 45 y 235
        isIlluminated = avgBrightness >= 45 && avgBrightness <= 235;
      }
    } catch {
      // Ignorar restricciones de canvas cross-origin si las hubiera
      isIlluminated = true;
    }
  }

  let message = '✓ Rostro detectado y enfocado';
  if (!isGoodScore) {
    message = 'Rostro no muy nítido. Mantén tu mirada fija a la cámara';
  } else if (!isIlluminated) {
    message = 'Iluminación deficiente o demasiado brillo en el rostro';
  } else if (isTooFar) {
    message = 'Acércate un poco más a la cámara';
  } else if (isTooClose) {
    message = 'Aléjate un poco de la cámara';
  } else if (!isCentered) {
    message = 'Centra tu rostro dentro del recuadro';
  }

  const isReadyForCapture = isGoodScore && isGoodDistance && isCentered && isIlluminated;

  return {
    detected: true,
    score,
    isIlluminated,
    isCentered,
    isGoodDistance,
    isReadyForCapture,
    message,
    descriptor: Array.from(detection.descriptor),
    detection,
  };
}

/**
 * Consulta si el cliente ya cuenta con biometría facial registrada en Supabase
 */
export async function getBiometriaCliente(clienteId: string): Promise<{
  registrado: boolean;
  biometria: ClienteBiometria | null;
}> {
  if (!clienteId) return { registrado: false, biometria: null };

  try {
    const { data, error } = await supabase
      .from('cliente_biometria')
      .select('*')
      .eq('cliente_id', clienteId);

    if (error) {
      console.warn('[Biometría] Error al consultar biometría:', error.message);
      return { registrado: false, biometria: null };
    }

    if (!data || data.length === 0) {
      return { registrado: false, biometria: null };
    }

    // Identificar si existe registro de tipo ROSTRO, facial o registrado con WEB_CAMERA
    const facialRecord = data.find(
      (b) =>
        b.tipo === 'ROSTRO' ||
        b.tipo === 'facial' ||
        b.proveedor_sensor === 'WEB_CAMERA' ||
        (typeof b.data_biometrica === 'string' && b.data_biometrica.includes('descriptor'))
    );

    if (facialRecord) {
      return { registrado: true, biometria: facialRecord };
    }

    return { registrado: false, biometria: null };
  } catch (err) {
    console.error('[Biometría] Error inesperado en getBiometriaCliente:', err);
    return { registrado: false, biometria: null };
  }
}

/**
 * Guarda o actualiza el descriptor facial de un socio en la tabla `cliente_biometria`
 */
export async function guardarBiometriaFacial({
  clienteId,
  descriptor,
  proveedorSensor = 'WEB_CAMERA',
}: {
  clienteId: string;
  descriptor: number[];
  proveedorSensor?: string;
}): Promise<{
  success: boolean;
  error?: string;
  data?: ClienteBiometria;
}> {
  if (!clienteId) {
    return { success: false, error: 'Se requiere el ID del socio para registrar su biometría.' };
  }

  if (!descriptor || descriptor.length !== 128) {
    return { success: false, error: 'El vector facial debe tener exactamente 128 dimensiones.' };
  }

  try {
    const dataBiometricaJson = JSON.stringify({
      descriptor: Array.from(descriptor),
      captured_at: new Date().toISOString(),
      provider: proveedorSensor,
    });

    // 1. Verificar si ya existe registro biométrico para actualizar o insertar
    const { biometria: existingRecord } = await getBiometriaCliente(clienteId);

    let tipoToUse = 'ROSTRO';
    const payload = {
      cliente_id: clienteId,
      tipo: tipoToUse,
      data_biometrica: dataBiometricaJson,
      proveedor_sensor: proveedorSensor,
    };

    if (existingRecord) {
      // Actualizar registro existente
      let updateRes = await supabase
        .from('cliente_biometria')
        .update(payload)
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateRes.error && updateRes.error.message.includes('cliente_biometria_tipo_check')) {
        // Fallback por si la base de datos aún no tiene la migración 'ROSTRO' aplicada
        console.warn(
          '[Biometría] cliente_biometria_tipo_check detectado. Aplicando compatibilidad con HUELLA_DIGITAL.'
        );
        payload.tipo = 'HUELLA_DIGITAL';
        updateRes = await supabase
          .from('cliente_biometria')
          .update(payload)
          .eq('id', existingRecord.id)
          .select()
          .single();
      }

      if (updateRes.error) {
        throw updateRes.error;
      }

      return { success: true, data: updateRes.data };
    } else {
      // Insertar nuevo registro
      let insertRes = await supabase
        .from('cliente_biometria')
        .insert(payload)
        .select()
        .single();

      if (insertRes.error && insertRes.error.message.includes('cliente_biometria_tipo_check')) {
        console.warn(
          '[Biometría] cliente_biometria_tipo_check detectado. Aplicando compatibilidad con HUELLA_DIGITAL.'
        );
        payload.tipo = 'HUELLA_DIGITAL';
        insertRes = await supabase
          .from('cliente_biometria')
          .insert(payload)
          .select()
          .single();
      }

      if (insertRes.error) {
        throw insertRes.error;
      }

      return { success: true, data: insertRes.data };
    }
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    console.error('[Biometría] Error al guardar descriptor:', err);
    return {
      success: false,
      error: errorObj.message || 'Error al guardar la biometría facial en la base de datos.',
    };
  }
}
