-- Ejecutar en el SQL Editor de Supabase.
-- Mantiene usuarios_sistema.sucursal_id por compatibilidad y agrega
-- asignaciones múltiples mediante una tabla puente.

ALTER TABLE usuarios_sistema
  ADD COLUMN IF NOT EXISTS ci varchar;

CREATE TABLE IF NOT EXISTS usuario_sucursales (
  usuario_id uuid NOT NULL REFERENCES usuarios_sistema(id) ON DELETE CASCADE,
  sucursal_id uuid NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, sucursal_id)
);

CREATE INDEX IF NOT EXISTS usuario_sucursales_sucursal_id_idx
  ON usuario_sucursales(sucursal_id);

INSERT INTO usuario_sucursales (usuario_id, sucursal_id)
SELECT id, sucursal_id
FROM usuarios_sistema
WHERE sucursal_id IS NOT NULL
ON CONFLICT (usuario_id, sucursal_id) DO NOTHING;

ALTER TABLE IF EXISTS usuario_sucursales DISABLE ROW LEVEL SECURITY;
