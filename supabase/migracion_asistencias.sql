-- ==============================================================================
-- MIGRACIÓN PARA TABLA ASISTENCIAS (GYM-DEMO)
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase si deseas
-- admitir tanto los valores legacy ('PERMITIDO', 'DENEGADO', 'CI_TECLADO', 'BIOMETRIA_FACIAL')
-- como los nuevos valores estructurados ('CONCEDIDO', 'DENEGADO_VENCIDO', 'DENEGADO_INACTIVO', 'CI', 'ROSTRO', etc.)
-- ==============================================================================

-- 1. Actualizar restricción check para estado_acceso
ALTER TABLE IF EXISTS asistencias 
  DROP CONSTRAINT IF EXISTS asistencias_estado_acceso_check;

ALTER TABLE IF EXISTS asistencias 
  ADD CONSTRAINT asistencias_estado_acceso_check 
  CHECK (estado_acceso IN (
    'CONCEDIDO',
    'PERMITIDO',
    'permitido',
    'DENEGADO',
    'denegado',
    'DENEGADO_VENCIDO',
    'DENEGADO_INACTIVO',
    'DENEGADO_HORARIO',
    'DENEGADO_CUPO'
  ));

-- 2. Actualizar restricción check para metodo_ingreso
ALTER TABLE IF EXISTS asistencias 
  DROP CONSTRAINT IF EXISTS asistencias_metodo_ingreso_check;

ALTER TABLE IF EXISTS asistencias 
  ADD CONSTRAINT asistencias_metodo_ingreso_check 
  CHECK (metodo_ingreso IN (
    'CI',
    'CI_TECLADO',
    'ROSTRO',
    'BIOMETRIA_FACIAL',
    'HUELLA',
    'QR',
    'MANUAL',
    'manual',
    'biometria',
    'qr'
  ));

-- 3. Asegurar que las políticas RLS permitan inserción y lectura
ALTER TABLE IF EXISTS asistencias DISABLE ROW LEVEL SECURITY;
