# Instructions for Antigravity Agent

## Project Overview
Prototipo SaaS de sistema de gestión para gimnasios construido con Next.js (App Router) y Supabase (PostgreSQL).
Diseñado para ser personalizado fácilmente por marcas/clientes (multi-tenant ready).

# Architecture & Routes Structure
- **Public Area (Landing Page):** `src/app/(public)/`
  - `src/app/(public)/page.tsx` -> Landing page promocional moderna, dinámica, animada, con Navbar público y Footer.
  - `src/app/(public)/login/page.tsx` -> Formulario de autenticación para personal y socios.
- **Private Admin Area (Dashboard):** `src/app/(dashboard)/`
  - `src/app/(dashboard)/layout.tsx` -> Sidebar/Navbar de navegación eficiente y enfocado en productividad.
  - `src/app/(dashboard)/dashboard/page.tsx` -> Panel principal de recepción e indicadores rápidos.
  - `src/app/(dashboard)/dashboard/clientes/page.tsx` -> Gestión de socios y biometría.
  - `src/app/(dashboard)/dashboard/asistencias/page.tsx` -> Control de accesos e ingresos.
  
## Tech Stack
- **Framework:** Next.js (TypeScript, App Router)
- **Database & Auth:** Supabase (@supabase/supabase-js)
- **Styling:** Tailwind CSS + CSS Variables para tematización fácil.
- **Directory Structure:** All code resides in `src/` (`src/app/`, `src/components/`, `src/lib/`, `src/styles/`)

## Environment Variables
Defined in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Connection & Schema Reference
Use `@/lib/supabase` to instantiate the Supabase client.
Always destructure response as `{ data, error }` and handle errors gracefully.

### Core Tables:
1. `organizaciones`: (id, nombre, slug, logo_url, plan_saas, estado, creado_en)
2. `sucursales`: (id, organizacion_id, nombre, direccion, telefono, ciudad, estado)
3. `usuarios_sistema`: (id, organizacion_id, sucursal_id, nombre, apellido, email, rol, estado)
4. `clientes`: (id, organizacion_id, ci, nombre, apellido, email, telefono, fecha_nacimiento, genero, foto_url, estado)
5. `cliente_biometria`: (id, cliente_id, tipo, data_biometrica, proveedor_sensor)
6. `membresias`: (id, organizacion_id, nombre, descripcion, duracion_dias, limite_ingresos, precio, es_multisucursal, hora_inicio, hora_fin, estado, creado_en)
7. `suscripciones`: (id, organizacion_id, sucursal_id, cliente_id, membresia_id, usuario_vendedor_id, fecha_inicio, fecha_fin, ingresos_restantes, monto_pagado, metodo_pago, estado_pago)
8. `asistencias`: (id, organizacion_id, sucursal_id, cliente_id, fecha_hora, metodo_ingreso, estado_acceso)
9. `landing_page_config`: (id, organizacion_id, titulo_principal, subtitulo, banner_url, horarios_json, redes_sociales_json, mostrar_precios_publicos)

## Color Palette & Design System Guidelines
To support easy rebranding for different gyms/clients, **NEVER hardcode hex color codes** like `bg-[#258847]` directly in components.

Always use semantic Tailwind theme colors configured via CSS variables:
- **Brand Primary:** `bg-primary`, `text-primary`, `border-primary` (#258847)
- **Brand Light / Hover:** `bg-primary-light`, `text-primary-light` (#4DA65B)
- **Brand Dark / Active:** `bg-primary-dark`, `bg-primary-dark` (#307958)
- Support Light / Dark mode classes using CSS theme variables defined in `src/app/globals.css`.

## Business Logic Guidelines
1. **Memberships & Subscriptions:** Active status is strictly determined by whether `current_date <= fecha_fin` in `suscripciones`.
2. **Attendance Checks:** Query `suscripciones` before logging attendance in `asistencias` to confirm active membership.
3. **UI/UX:** Responsive desktop-first design optimized for fast reception desk operations.