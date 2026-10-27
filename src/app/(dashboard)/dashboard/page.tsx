'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  UserPlus,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Fingerprint,
  QrCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ensureDatabaseSeeded, seedDemoClientsAndActivity, FALLBACK_ORGANIZACION } from '@/lib/seed';
import ModalAsignarMembresia from '@/components/ui/ModalAsignarMembresia';

interface AsistenciaRow {
  id: string;
  fecha_hora: string;
  metodo_ingreso: string;
  estado_acceso: string;
  clientes?: {
    id: string;
    nombre: string;
    apellido: string;
    ci: string;
    foto_url: string | null;
  } | null;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const displayName = profile?.nombre ? `${profile.nombre}` : 'Recepción';

  // Estados de métricas reales
  const [loadingStats, setLoadingStats] = useState(true);
  const [sociosActivos, setSociosActivos] = useState<number | null>(null);
  const [ingresosHoy, setIngresosHoy] = useState<number | null>(null);
  const [membresiasPorVencer, setMembresiasPorVencer] = useState<number | null>(null);
  const [totalMembresias, setTotalMembresias] = useState<number | null>(null);

  // Últimas asistencias
  const [ultimasAsistencias, setUltimasAsistencias] = useState<AsistenciaRow[]>([]);

  // Estado para sembrar datos de muestra si la base de datos está vacía
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Modal de cobro / asignación de membresía
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoadingStats(true);
    try {
      // 1. Conteo de socios activos (estado = 'ACTIVO' o 'activo')
      const { count: sociosCount, error: sociosError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .or('estado.eq.activo,estado.eq.ACTIVO');

      if (!sociosError) {
        setSociosActivos(sociosCount ?? 0);
      }

      // 2. Conteo de ingresos hoy (asistencias de la fecha actual)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { count: asistenciasCount, error: asistenciasError } = await supabase
        .from('asistencias')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_hora', startOfToday.toISOString());

      if (!asistenciasError) {
        setIngresosHoy(asistenciasCount ?? 0);
      }

      // 3. Conteo de membresías por vencer (suscripciones donde fecha_fin esté en los próximos 7 días)
      const todayStr = new Date().toISOString().split('T')[0];
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { count: suscripcionesVencerCount, error: suscripcionesError } = await supabase
        .from('suscripciones')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_fin', todayStr)
        .lte('fecha_fin', in7Days);

      if (!suscripcionesError) {
        setMembresiasPorVencer(suscripcionesVencerCount ?? 0);
      }

      // 4. Conteo de membresías configuradas
      const { count: planesCount } = await supabase
        .from('membresias')
        .select('*', { count: 'exact', head: true });

      setTotalMembresias(planesCount ?? 0);

      // 5. Últimas 5 asistencias con Join a clientes
      const { data: asistenciasData, error: ultimasError } = await supabase
        .from('asistencias')
        .select(`
          id,
          fecha_hora,
          metodo_ingreso,
          estado_acceso,
          clientes (
            id,
            nombre,
            apellido,
            ci,
            foto_url
          )
        `)
        .order('fecha_hora', { ascending: false })
        .limit(5);

      if (!ultimasError && asistenciasData) {
        setUltimasAsistencias(asistenciasData as unknown as AsistenciaRow[]);
      }
    } catch (err) {
      console.error('[Dashboard] Error al consultar métricas:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Función para poblar con datos de prueba si la base de datos está vacía
  async function handlePopulateDemo() {
    setSeedingDemo(true);
    try {
      const seed = await ensureDatabaseSeeded();
      const orgId = seed.organizacion?.id || profile?.organizacion_id || FALLBACK_ORGANIZACION.id;
      const sucursalId = seed.sucursal?.id || null;
      const membresiaId = seed.membresias?.[0]?.id || null;

      await seedDemoClientsAndActivity(orgId, sucursalId, membresiaId);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error al sembrar datos de prueba:', err);
    } finally {
      setSeedingDemo(false);
    }
  }

  const todayFormatted = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* ── Saludo y Fecha ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Buen día, {displayName} 👋
          </h1>
          <p className="mt-1 text-xs capitalize text-muted">{todayFormatted}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón para sembrar datos si la base está en cero */}
          {(sociosActivos === 0 || sociosActivos === null) && (
            <button
              onClick={handlePopulateDemo}
              disabled={seedingDemo}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{seedingDemo ? 'Generando demo...' : 'Cargar Datos Demo'}</span>
            </button>
          )}

          <button
            onClick={() => fetchDashboardData()}
            title="Actualizar métricas"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Tarjetas de Indicadores Conectadas a Supabase ───────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
            Indicadores en Tiempo Real
          </h2>
          <span className="text-[11px] text-muted flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Conectado a PostgreSQL
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Socios Activos */}
          <Link
            href="/dashboard/clientes"
            className="group rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-foreground">
              {loadingStats ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-border" />
              ) : (
                sociosActivos ?? 0
              )}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">Socios Activos</p>
            <p className="mt-0.5 text-[10px] text-primary">Estado: Activo en sistema</p>
          </Link>

          {/* 2. Ingresos Hoy */}
          <Link
            href="/dashboard/asistencias"
            className="group rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-primary">
              {loadingStats ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-border" />
              ) : (
                ingresosHoy ?? 0
              )}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">Ingresos Hoy</p>
            <p className="mt-0.5 text-[10px] text-muted">Accesos registrados hoy</p>
          </Link>

          {/* 3. Membresías por Vencer */}
          <Link
            href="/dashboard/membresias"
            className="group rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition-all hover:border-amber-500 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {loadingStats ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-border" />
              ) : (
                membresiasPorVencer ?? 0
              )}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">Membresías por Vencer</p>
            <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
              Vencen en los próximos 7 días
            </p>
          </Link>

          {/* 4. Planes de Membresía */}
          <Link
            href="/dashboard/membresias"
            className="group rounded-2xl border border-surface-border bg-surface p-5 shadow-sm transition-all hover:border-primary hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold text-foreground">
              {loadingStats ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-border" />
              ) : (
                totalMembresias ?? 0
              )}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">Planes Disponibles</p>
            <p className="mt-0.5 text-[10px] text-primary">Tarifas configuradas</p>
          </Link>
        </div>
      </section>

      {/* ── Accesos Rápidos para Recepción ──────────────────────────── */}
      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
          Operación de Mostrador
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/asistencias"
            className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ClipboardList className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Control de Asistencias
              </p>
              <p className="mt-0.5 text-xs text-muted">Registrar ingreso por CI o biometría</p>
            </div>
          </Link>

          <Link
            href="/dashboard/clientes"
            className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <UserPlus className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Registrar Socio
              </p>
              <p className="mt-0.5 text-xs text-muted">Alta de nuevo cliente y suscripción</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSubModalOpen(true)}
            className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 text-left transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <CreditCard className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Membresías & Pagos
              </p>
              <p className="mt-0.5 text-xs text-muted">Cobrar planes y renovaciones rápidas</p>
            </div>
          </button>

          <Link
            href="/dashboard/configuracion/usuarios"
            className="group flex flex-col justify-between rounded-2xl border border-surface-border bg-surface p-5 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Personal & Usuarios
              </p>
              <p className="mt-0.5 text-xs text-muted">Gestión de roles y accesos</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── Últimas Asistencias Reales de Supabase ─────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Últimas Asistencias Registradas
            </h2>
            <p className="text-xs text-muted">
              Monitoreo en vivo de los accesos a la sala de entrenamiento
            </p>
          </div>
          <Link
            href="/dashboard/asistencias"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-sm">
          {loadingStats ? (
            <div className="p-10 text-center text-xs text-muted">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-2 font-medium">Consultando asistencias en Supabase...</p>
            </div>
          ) : ultimasAsistencias.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted/40" />
              <p className="mt-3 text-sm font-bold text-foreground">
                No hay ingresos registrados todavía hoy
              </p>
              <p className="mt-1 text-xs text-muted">
                Los accesos aparecerán automáticamente al validar socios en recepción o torniquetes.
              </p>
              <button
                onClick={handlePopulateDemo}
                disabled={seedingDemo}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Cargar Datos de Demostración</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-border bg-background/50 uppercase tracking-wider font-semibold text-muted">
                  <tr>
                    <th className="px-6 py-3.5">Socio</th>
                    <th className="px-6 py-3.5">Cédula / DNI</th>
                    <th className="px-6 py-3.5">Hora de Ingreso</th>
                    <th className="px-6 py-3.5">Método</th>
                    <th className="px-6 py-3.5 text-right">Estado Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ultimasAsistencias.map((row) => {
                    const client = row.clientes;
                    const clientName = client
                      ? `${client.nombre} ${client.apellido}`
                      : 'Socio Desconocido';
                    const initial = client?.nombre?.charAt(0).toUpperCase() || 'S';

                    const dateObj = new Date(row.fecha_hora);
                    const timeStr = dateObj.toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    });

                    return (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-background/40"
                      >
                        {/* Socio */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                              {initial}
                            </div>
                            <span className="font-bold text-foreground">{clientName}</span>
                          </div>
                        </td>

                        {/* CI */}
                        <td className="px-6 py-4 font-mono text-muted">
                          {client?.ci || '—'}
                        </td>

                        {/* Hora */}
                        <td className="px-6 py-4 text-foreground font-semibold">
                          {timeStr}
                        </td>

                        {/* Método de Ingreso */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-muted">
                            {row.metodo_ingreso === 'biometria' && (
                              <>
                                <Fingerprint className="h-3.5 w-3.5 text-primary" />
                                <span>Biometría</span>
                              </>
                            )}
                            {row.metodo_ingreso === 'qr' && (
                              <>
                                <QrCode className="h-3.5 w-3.5 text-primary" />
                                <span>Código QR</span>
                              </>
                            )}
                            {row.metodo_ingreso === 'manual' && (
                              <>
                                <ClipboardList className="h-3.5 w-3.5 text-muted" />
                                <span>Manual</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Estado Acceso */}
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              row.estado_acceso === 'permitido'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-red-500/15 text-red-600 dark:text-red-400'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="capitalize">{row.estado_acceso}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ── Modal de Cobro / Asignación de Membresía ─────────────────── */}
      <ModalAsignarMembresia
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        clientePreseleccionado={null}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
