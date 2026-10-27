-- ==============================================================================
-- MIGRACIÓN PARA BIOMETRÍA FACIAL (GYM-DEMO)
-- Ejecutar en el SQL Editor de tu Dashboard de Supabase.
-- Permite el tipo 'ROSTRO' en la tabla cliente_biometria y deshabilita RLS si aplica.
-- ==============================================================================

-- 1. Eliminar la restricción check existente si restringe a solo huella/qr/pin
ALTER TABLE IF EXISTS cliente_biometria 
  DROP CONSTRAINT IF EXISTS cliente_biometria_tipo_check;

-- 2. Agregar la nueva restricción que admite 'ROSTRO' y otros tipos biométricos
ALTER TABLE IF EXISTS cliente_biometria 
  ADD CONSTRAINT cliente_biometria_tipo_check 
  CHECK (tipo IN ('ROSTRO', 'facial', 'HUELLA_DIGITAL', 'CODIGO_QR', 'PIN_NUMERICO', 'huella', 'iris'));

-- 3. Asegurar que las políticas RLS permitan lectura y escritura pública/anon si corresponde
ALTER TABLE IF EXISTS cliente_biometria DISABLE ROW LEVEL SECURITY;
