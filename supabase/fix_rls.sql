-- ==============================================================================
-- FIX RLS PARA SUPABASE (PROYECTO GYM-DEMO)
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase si deseas
-- permitir lectura y escritura desde la aplicación web con la clave publishable / anon.
-- ==============================================================================

-- Opción A: Deshabilitar RLS temporalmente para desarrollo / demo rápido:
ALTER TABLE IF EXISTS organizaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sucursales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios_sistema DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cliente_biometria DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS membresias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suscripciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS landing_page_config DISABLE ROW LEVEL SECURITY;

-- Opción B: Políticas permisivas si prefieres mantener RLS habilitado:
-- (Descomenta las siguientes líneas si prefieres usar RLS con políticas públicas)

/*
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en organizaciones" ON organizaciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en sucursales" ON sucursales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE usuarios_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en usuarios_sistema" ON usuarios_sistema FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cliente_biometria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en cliente_biometria" ON cliente_biometria FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en membresias" ON membresias FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en suscripciones" ON suscripciones FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en asistencias" ON asistencias FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE landing_page_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo en landing_page_config" ON landing_page_config FOR ALL USING (true) WITH CHECK (true);
*/
